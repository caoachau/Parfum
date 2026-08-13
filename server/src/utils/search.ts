const VIETNAMESE_CHARACTER_CLASSES: Record<string, string> = {
  a: 'aàáạảãâầấậẩẫăằắặẳẵ',
  d: 'dđ',
  e: 'eèéẹẻẽêềếệểễ',
  i: 'iìíịỉĩ',
  o: 'oòóọỏõôồốộổỗơờớợởỡ',
  u: 'uùúụủũưừứựửữ',
  y: 'yỳýỵỷỹ',
};

const PRODUCT_GENERIC_PHRASES = ['nuoc hoa', 'chinh hang', 'san pham'];
const PRODUCT_GENERIC_WORDS = new Set([
  'authentic',
  'chai',
  'cho',
  'danh',
  'for',
  'fragrance',
  'genuine',
  'kiem',
  'loai',
  'perfume',
  'tim',
]);

const TOKEN_CANONICAL: Record<string, string> = {
  male: 'nam',
  man: 'nam',
  men: 'nam',
  female: 'nu',
  woman: 'nu',
  women: 'nu',
};

const TOKEN_ALTERNATIVES: Record<string, string[]> = {
  nam: ['nam', 'male', 'man', 'men'],
  nu: ['nu', 'female', 'woman', 'women'],
};

export type WeightedSearchField = {
  value: unknown;
  weight?: number;
};

export function normalizeSearchText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function uniqueTokens(value: string, maxTokens = 8, canonicalize = false): string[] {
  return Array.from(
    new Set(
      value
        .split(' ')
        .map((token) => (canonicalize ? TOKEN_CANONICAL[token] || token : token))
        .filter(Boolean),
    ),
  ).slice(0, maxTokens);
}

export function tokenizeSearchQuery(value: unknown, maxTokens = 8): string[] {
  return uniqueTokens(normalizeSearchText(value), maxTokens);
}

export function tokenizeProductSearchQuery(value: unknown, maxTokens = 8): string[] {
  let normalized = normalizeSearchText(value);
  for (const phrase of PRODUCT_GENERIC_PHRASES) {
    normalized = normalized.replace(new RegExp(`\\b${phrase.replace(' ', '\\s+')}\\b`, 'g'), ' ');
  }

  return uniqueTokens(normalized, maxTokens, true).filter(
    (token) => !PRODUCT_GENERIC_WORDS.has(token),
  );
}

export function searchTokenAlternatives(token: string): string[] {
  const normalized = normalizeSearchText(token);
  const canonical = TOKEN_CANONICAL[normalized] || normalized;
  return TOKEN_ALTERNATIVES[canonical] || [canonical];
}

function valueToSearchText(value: unknown): string {
  if (Array.isArray(value)) return normalizeSearchText(value.join(' '));
  return normalizeSearchText(value);
}

export function matchesAllSearchTokens(values: unknown[], tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const searchValues = values.map(valueToSearchText).filter(Boolean);
  return tokens.every((token) => {
    const alternatives = searchTokenAlternatives(token);
    if (alternatives.length > 1) {
      return searchValues.some((value) =>
        value.split(' ').some((word) => alternatives.includes(word)),
      );
    }
    return searchValues.some((value) => value.includes(alternatives[0]));
  });
}

function accentInsensitivePattern(value: string): string {
  return normalizeSearchText(value)
    .split('')
    .map((character) => {
      const characterClass = VIETNAMESE_CHARACTER_CLASSES[character];
      if (characterClass) return `[${characterClass}]`;
      return character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
}

export function createSearchRegex(token: string, expandSynonyms = false): RegExp {
  const normalized = normalizeSearchText(token);
  const alternatives = (expandSynonyms ? searchTokenAlternatives(token) : [normalized]).map(
    accentInsensitivePattern,
  );
  const pattern = `(?:${alternatives.join('|')})`;
  // Dong nghia gioi tinh dung cho field co gia tri male/female/unisex, can khop tron gia tri
  // de "male" khong bi nhan nham khi nam ben trong "female".
  return new RegExp(expandSynonyms && alternatives.length > 1 ? `^${pattern}$` : pattern, 'i');
}

export function scoreSearchFields(tokens: string[], fields: WeightedSearchField[]): number {
  if (tokens.length === 0) return 0;
  const phrase = tokens.join(' ');
  let score = 0;

  for (const field of fields) {
    const text = valueToSearchText(field.value);
    if (!text) continue;
    const weight = field.weight ?? 1;

    if (text === phrase) score += weight * 80;
    else if (text.startsWith(phrase)) score += weight * 45;
    else if (text.includes(phrase)) score += weight * 30;

    let tokensInField = 0;
    for (const token of tokens) {
      const alternatives = searchTokenAlternatives(token);
      const words = text.split(' ');
      const usesSynonyms = alternatives.length > 1;
      const exact = alternatives.some((alternative) => text === alternative);
      const starts = alternatives.some((alternative) =>
        usesSynonyms ? words.includes(alternative) : text.startsWith(alternative),
      );
      const includes = alternatives.some((alternative) =>
        usesSynonyms ? words.includes(alternative) : text.includes(alternative),
      );
      if (exact) score += weight * 20;
      else if (starts) score += weight * 12;
      else if (includes) score += weight * 7;
      if (includes) tokensInField += 1;
    }

    if (tokensInField === tokens.length) score += weight * 15;
  }

  return score;
}
