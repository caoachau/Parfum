import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { adminApi, apiMessage, formatDate, type Paginated } from "../../lib/adminApi";
import { toast } from "../../store/toast.store";
import ImageUploader from "../../components/admin/ImageUploader";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from "../../components/admin/ui";
import { BLOG_ARTICLES, type BlogArticle } from "../blogData";

type BlogStatus = "draft" | "published";
type BlogSectionForm = {
  heading: string;
  body: string;
  image: string;
  imageCaption: string;
};
type BlogForm = {
  title: string;
  slug: string;
  category: string;
  description: string;
  image: string;
  heroImage: string;
  author: string;
  date: string;
  status: BlogStatus;
  relatedSlugs: string[];
  sections: BlogSectionForm[];
};

const emptySection: BlogSectionForm = {
  heading: "",
  body: "",
  image: "",
  imageCaption: "",
};

const emptyForm: BlogForm = {
  title: "",
  slug: "",
  category: "Tin tức",
  description: "",
  image: "",
  heroImage: "",
  author: "",
  date: "",
  status: "draft",
  relatedSlugs: [],
  sections: [{ ...emptySection }],
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDateInput(value: string) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return "";
}

function articleToForm(article: BlogArticle): BlogForm {
  return {
    title: article.title,
    slug: article.slug,
    category: article.category,
    description: article.description,
    image: article.image,
    heroImage: article.heroImage || article.image,
    author: article.author || "",
    date: toDateInput(article.date || ""),
    status: ((article as any).status || "draft") as BlogStatus,
    relatedSlugs: article.relatedSlugs || [],
    sections: article.sections?.length
      ? article.sections.map((section) => ({
          heading: section.heading || "",
          body: section.body || "",
          image: section.image || "",
          imageCaption: section.imageCaption || "",
        }))
      : [{ ...emptySection }],
  };
}

function formToPayload(form: BlogForm) {
  return {
    title: form.title.trim(),
    slug: form.slug.trim() || slugify(form.title),
    category: form.category.trim(),
    description: form.description.trim(),
    image: form.image.trim(),
    heroImage: form.heroImage.trim() || form.image.trim(),
    author: form.author.trim(),
    date: form.date.trim(),
    status: form.status,
    relatedSlugs: form.relatedSlugs,
    sections: form.sections
      .map((section) => ({
        heading: section.heading.trim(),
        body: section.body.trim(),
        image: section.image.trim(),
        imageCaption: section.imageCaption.trim(),
      }))
      .filter((section) => section.body),
  };
}

export default function AdminBlog() {
  const [rows, setRows] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<BlogArticle | null | undefined>();
  const [deleting, setDeleting] = useState<BlogArticle | null>(null);
  const [form, setForm] = useState<BlogForm>(emptyForm);
  const publishedOptions = rows.filter((article) => {
    const status = ((article as any).status || "draft") as BlogStatus;
    const currentSlug = form.slug.trim() || slugify(form.title);
    return status === "published" && article.slug !== currentSlug;
  });

  function showJournalToast(
    status: BlogStatus,
    fallback: string,
    article?: BlogArticle & {
      journalNotification?: {
        subscriberCount: number;
        sentCount: number;
        failedCount?: number;
        skippedReason?: string;
      };
    },
  ) {
    if (status !== "published") {
      toast.success(fallback);
      return;
    }

    const journal = article?.journalNotification;
    if (!journal) {
      toast.success(fallback);
      return;
    }
    if (journal.skippedReason === "already_notified") {
      toast.success("Đã cập nhật bài viết đã xuất bản");
      return;
    }
    if (journal.skippedReason === "no_subscribers") {
      toast.success("Đã xuất bản bài viết. Hiện chưa có email đăng ký nhận journal.");
      return;
    }
    if (journal.skippedReason === "smtp_not_configured") {
      toast.error("Đã xuất bản bài viết nhưng chưa gửi email: SMTP chưa được cấu hình.");
      return;
    }
    if (journal.sentCount > 0) {
      toast.success(
        `Đã xuất bản và gửi email cho ${journal.sentCount}/${journal.subscriberCount} khách đăng ký journal`,
      );
      return;
    }
    toast.error(
      "Đã xuất bản bài viết nhưng chưa gửi được email. Kiểm tra SMTP hoặc email subscriber.",
    );
  }

  async function load() {
    try {
      setLoading(true);
      await adminApi
        .post("/blog/import-defaults", {
          articles: BLOG_ARTICLES.map((article) => ({
            ...article,
            status: "published",
          })),
        })
        .catch((error) => {
          toast.error(apiMessage(error, "Không đồng bộ được bài viết cũ"));
        });
      const res = await adminApi.get<Paginated<BlogArticle>>("/blog", { limit: 100 });
      setRows(res.data);
    } catch (e) {
      toast.error(apiMessage(e, "Không tải được danh sách tin tức"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openForm(article?: BlogArticle) {
    setEditing(article ?? null);
    setForm(article ? articleToForm(article) : { ...emptyForm, sections: [{ ...emptySection }] });
  }

  function updateSection(index: number, patch: Partial<BlogSectionForm>) {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, ...patch } : section,
      ),
    }));
  }

  async function saveWithStatus(status: BlogStatus = form.status) {
    if (!form.title.trim()) return toast.error("Vui lòng nhập tiêu đề bài viết");
    if (!form.description.trim()) return toast.error("Vui lòng nhập mô tả ngắn");
    if (!form.image.trim()) return toast.error("Vui lòng chọn ảnh thumbnail");
    if (!form.sections.some((section) => section.body.trim())) {
      return toast.error("Bài viết cần ít nhất một phần nội dung");
    }
    try {
      setSaving(true);
      const payload = formToPayload({ ...form, status });
      const saved = editing
        ? await adminApi.put<BlogArticle>(`/blog/${editing.id}`, payload)
        : await adminApi.post<BlogArticle>("/blog", payload);
      showJournalToast(
        status,
        status === "published"
          ? "Đã xuất bản bài viết"
          : editing
            ? "Đã cập nhật bài viết"
            : "Đã lưu bản nháp",
        saved,
      );
      setEditing(undefined);
      await load();
    } catch (e) {
      toast.error(apiMessage(e, "Không lưu được bài viết"));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(article: BlogArticle, status: BlogStatus) {
    try {
      setSaving(true);
      const saved = await adminApi.put<BlogArticle>(`/blog/${article.id}`, {
        ...formToPayload(articleToForm(article)),
        status,
      });
      showJournalToast(
        status,
        status === "published" ? "Đã xuất bản bài viết" : "Đã chuyển về bản nháp",
        saved,
      );
      await load();
    } catch (e) {
      toast.error(apiMessage(e, "Không cập nhật trạng thái bài viết"));
    } finally {
      setSaving(false);
    }
  }

  function addRelatedSlug(slug: string) {
    if (!slug) return;
    setForm((current) => ({
      ...current,
      relatedSlugs: current.relatedSlugs.includes(slug)
        ? current.relatedSlugs
        : [...current.relatedSlugs, slug],
    }));
  }

  function removeRelatedSlug(slug: string) {
    setForm((current) => ({
      ...current,
      relatedSlugs: current.relatedSlugs.filter((item) => item !== slug),
    }));
  }

  async function remove() {
    if (!deleting) return;
    try {
      setSaving(true);
      await adminApi.del(`/blog/${deleting.id}`);
      toast.success("Đã xóa bài viết");
      setDeleting(null);
      await load();
    } catch (e) {
      toast.error(apiMessage(e, "Không xóa được bài viết"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Tin tức / Blog"
        subtitle="Quản lý bài viết hiển thị ở trang Blog"
        actions={<Button onClick={() => openForm()}>Thêm bài viết</Button>}
      />

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState message="Chưa có bài viết trong hệ thống quản trị." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Bài viết</th>
                  <th className="px-4 py-3">Danh mục</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Cập nhật</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((article) => (
                  <tr key={article.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          loading="lazy"
                          src={article.image}
                          alt={article.title}
                          className="h-12 w-16 rounded bg-gray-100 object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{article.title}</p>
                          <p className="text-xs text-gray-400">/{article.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{article.category}</td>
                    <td className="px-4 py-3">
                      <Badge color={(article as any).status === "published" ? "green" : "gray"}>
                        {(article as any).status === "published" ? "Đã xuất bản" : "Bản nháp"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate((article as any).updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {((article as any).status || "draft") === "published" ? (
                          <Button
                            variant="secondary"
                            disabled={saving}
                            onClick={() => changeStatus(article, "draft")}
                          >
                            Gỡ xuất bản
                          </Button>
                        ) : (
                          <Button
                            disabled={saving}
                            onClick={() => changeStatus(article, "published")}
                          >
                            Xuất bản
                          </Button>
                        )}
                        <Button variant="secondary" onClick={() => openForm(article)}>
                          Sửa
                        </Button>
                        <Button variant="danger" onClick={() => setDeleting(article)}>
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={editing ? "Sửa bài viết" : "Thêm bài viết"}
        wide
        footer={
          <>
            <div className="mr-auto flex items-center gap-2">
              <Badge color={form.status === "published" ? "green" : "gray"}>
                {form.status === "published" ? "Đã xuất bản" : "Bản nháp"}
              </Badge>
            </div>
            <Button variant="secondary" onClick={() => setEditing(undefined)}>
              Hủy
            </Button>
            <Button variant="secondary" onClick={() => saveWithStatus("draft")} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu nháp"}
            </Button>
            <Button onClick={() => saveWithStatus("published")} disabled={saving}>
              {saving
                ? "Đang xuất bản..."
                : form.status === "published"
                  ? "Cập nhật xuất bản"
                  : "Xuất bản"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tiêu đề">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="Slug">
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder={slugify(form.title)}
            />
          </Field>
          <Field label="Danh mục">
            <Input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </Field>
          <Field label="Tác giả">
            <Input
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
            />
          </Field>
          <Field label="Ngày hiển thị">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Bài viết liên quan" hint="Chọn từ các bài đã xuất bản trước đó.">
            <div className="space-y-2">
              <Select value="" onChange={(e) => addRelatedSlug(e.target.value)}>
                <option value="">Chọn bài viết</option>
                {publishedOptions
                  .filter((article) => !form.relatedSlugs.includes(article.slug))
                  .map((article) => (
                    <option key={article.slug} value={article.slug}>
                      {article.title}
                    </option>
                  ))}
              </Select>
              {form.relatedSlugs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.relatedSlugs.map((slug) => {
                    const article = rows.find((item) => item.slug === slug);
                    return (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => removeRelatedSlug(slug)}
                        className="rounded-full bg-[#F1EEE8] px-3 py-1 text-xs text-gray-700 transition hover:bg-red-50 hover:text-red-700"
                        title="Bấm để bỏ bài liên quan"
                      >
                        {article?.title || slug} ×
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Field>
          <Field label="Ảnh thumbnail">
            <div className="space-y-2">
              <Input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
              />
              <ImageUploader
                multiple={false}
                folder="news"
                label="Chọn ảnh thumbnail"
                onUploaded={(urls) =>
                  setForm((current) => ({ ...current, image: urls[0] || current.image }))
                }
              />
              {form.image && (
                <img
                  loading="lazy"
                  src={form.image}
                  alt="Xem trước thumbnail"
                  className="h-28 w-full border border-gray-200 object-cover"
                />
              )}
            </div>
          </Field>
          <Field label="Ảnh hero">
            <div className="space-y-2">
              <Input
                value={form.heroImage}
                onChange={(e) => setForm({ ...form, heroImage: e.target.value })}
                placeholder="Mặc định dùng thumbnail"
              />
              <ImageUploader
                multiple={false}
                folder="news"
                label="Chọn ảnh hero"
                onUploaded={(urls) =>
                  setForm((current) => ({ ...current, heroImage: urls[0] || current.heroImage }))
                }
              />
              {form.heroImage && (
                <img
                  loading="lazy"
                  src={form.heroImage}
                  alt="Xem trước ảnh hero"
                  className="h-28 w-full border border-gray-200 object-cover"
                />
              )}
            </div>
          </Field>
        </div>
        <div className="mt-4 space-y-4">
          <Field label="Mô tả ngắn">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="min-h-[80px]"
            />
          </Field>
          <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Nội dung bài viết</p>
              <p className="mt-1 text-xs text-gray-500">
                Quản lý tiêu đề, nội dung và ảnh của từng phần.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  sections: [...current.sections, { ...emptySection }],
                }))
              }
            >
              <Plus className="h-4 w-4" /> Thêm phần
            </Button>
          </div>

          <div className="space-y-5">
            {form.sections.map((section, index) => (
              <section key={index} className="border border-gray-200 bg-gray-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Phần {String(index + 1).padStart(2, "0")}
                  </p>
                  <Button
                    type="button"
                    variant="danger"
                    title="Xóa phần"
                    disabled={form.sections.length === 1}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        sections: current.sections.filter(
                          (_, sectionIndex) => sectionIndex !== index,
                        ),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <Field label="Tiêu đề phần">
                    <Input
                      value={section.heading}
                      onChange={(event) => updateSection(index, { heading: event.target.value })}
                      placeholder="Có thể để trống"
                    />
                  </Field>
                  <Field label="Nội dung">
                    <Textarea
                      value={section.body}
                      onChange={(event) => updateSection(index, { body: event.target.value })}
                      className="min-h-[150px]"
                    />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Ảnh trong phần">
                      <div className="space-y-2">
                        <Input
                          value={section.image}
                          onChange={(event) => updateSection(index, { image: event.target.value })}
                          placeholder="URL ảnh"
                        />
                        <ImageUploader
                          multiple={false}
                          folder="news"
                          label="Chọn ảnh"
                          onUploaded={(urls) =>
                            updateSection(index, { image: urls[0] || section.image })
                          }
                        />
                        {section.image && (
                          <img
                            loading="lazy"
                            src={section.image}
                            alt="Xem trước"
                            className="h-28 w-full border border-gray-200 object-cover"
                          />
                        )}
                      </div>
                    </Field>
                    <Field label="Chú thích ảnh">
                      <Textarea
                        value={section.imageCaption}
                        onChange={(event) =>
                          updateSection(index, { imageCaption: event.target.value })
                        }
                        className="min-h-[100px]"
                      />
                    </Field>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Xóa bài viết"
        message={`Xóa "${deleting?.title || ""}"? Hành động này không thể hoàn tác.`}
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
        loading={saving}
      />
    </div>
  );
}
