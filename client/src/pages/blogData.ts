export interface BlogArticle {
  id: number | string;
  slug: string;
  category: string;
  title: string;
  description: string;
  image: string;
  heroImage: string;
  date: string;
  readTime: string;
  author: string;
  sections: {
    heading?: string;
    body: string;
    image?: string;
    imageCaption?: string;
  }[];
  relatedSlugs: string[];
}

export const BLOG_ARTICLES: BlogArticle[] = [
  // ─── 5 bài viết tĩnh gốc ───────────────────────────────────────────────────
  {
    id: 1,
    slug: "visualizing-the-invisible-synesthesia",
    category: "Nghệ thuật & Khứu giác",
    title: "Hình dung điều vô hình: Dự án Synesthesia",
    description:
      "Bạn có thể nhìn thấy một mùi hương không? Chúng tôi hợp tác với ba nghệ sĩ kỹ thuật số để chuyển bộ sưu tập mới nhất thành những bản giao hưởng thị giác.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
    date: "12 tháng 7, 2025",
    readTime: "8 phút đọc",
    author: "Élise Moreau",
    sections: [
      {
        body: "Có những mùi hương không thể diễn đạt bằng ngôn từ thông thường. Chúng tồn tại ở ranh giới giữa ký ức và cảm xúc, giữa cái hữu hình và cái vô hình. Đó là lý do chúng tôi bắt đầu The Synesthesia Project — một thử nghiệm nghệ thuật hỏi một câu hỏi đơn giản: Bạn có thể *nhìn thấy* một mùi hương không?",
      },
      {
        heading: "Hợp tác với ba nghệ sĩ",
        body: "Chúng tôi mời ba nghệ sĩ kỹ thuật số từ Tokyo, Amsterdam và São Paulo. Mỗi người nhận một chai nước hoa từ bộ sưu tập Dark Series mà không có bất kỳ mô tả nào. Nhiệm vụ của họ: tạo ra một tác phẩm hình ảnh dựa hoàn toàn vào cảm nhận khứu giác. Kết quả là ba thế giới hoàn toàn khác nhau — từ những đường cong ánh sáng vàng của Noir Intense đến những xoáy nước màu tím của Velvet Oud.",
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9O7RuzAY9dotSVNOmqwGjL6iy6APcFLC7eoYEhOT_mA&s=10",
        imageCaption: "Tác phẩm 'Noir Intense' của nghệ sĩ Yuki Tanaka, Tokyo — 2025",
      },
      {
        heading: "Khoa học đằng sau synesthesia",
        body: "Synesthesia là hiện tượng thần kinh trong đó kích thích một giác quan tự động kích hoạt giác quan khác. Khoảng 4% dân số có khả năng này — họ nghe thấy màu sắc, nhìn thấy âm thanh, hoặc trong trường hợp hiếm hơn, ngửi thấy hình dạng. Dự án này không cố tái tạo synesthesia mà đặt câu hỏi: nếu mùi hương có thể được 'dịch', ngôn ngữ thị giác nào sẽ được chọn?",
      },
      {
        heading: "Triển lãm & bộ sưu tập",
        body: "Ba tác phẩm sẽ được trưng bày tại gallery của chúng tôi từ tháng 9 năm 2025, kèm theo phiên bản giới hạn của Dark Series với bao bì lấy cảm hứng từ mỗi nghệ sĩ. Đây là lần đầu tiên chúng tôi để ngôn ngữ thị giác định hình ngôn ngữ khứu giác — và không phải ngược lại.",
        image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&q=80",
        imageCaption: "Phác thảo bao bì phiên bản giới hạn — sắp ra mắt tháng 9/2025",
      },
    ],
    relatedSlugs: ["scenting-brutalism-cold-air", "molecular-poetry-cedarwood"],
  },
  {
    id: 2,
    slug: "scenting-brutalism-cold-air",
    category: "Không gian",
    title: "Ướp hương cho Brutalism: Kiến trúc của không khí lạnh",
    description:
      "Khám phá cách những nốt khoáng của bê tông và kim loại lạnh gợi nên cảm giác bình yên vững chãi trong đời sống hiện đại.",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&q=80",
    date: "28 tháng 6, 2025",
    readTime: "6 phút đọc",
    author: "Marcus de Vries",
    sections: [
      {
        body: "Kiến trúc Brutalist — bê tông thô, hình học lạnh lùng, im lặng nặng nề — là ngôn ngữ thẩm mỹ bị hiểu lầm nhất thế kỷ 20. Nhưng những ai đã từng đứng trong một tòa nhà Brutalist thực sự sẽ biết: có một sự bình yên kỳ lạ ở đó. Câu hỏi của chúng tôi là — mùi hương nào sẽ tái tạo được cảm giác đó?",
      },
      {
        heading: "Ngôn ngữ của đá và kim loại",
        body: "Concrete absolute — một nguyên liệu nước hoa cực kỳ hiếm được chưng cất từ bê tông thực sự — mang theo hơi thở của đất ẩm sau mưa và không khí lạnh của tầng hầm bảo tàng. Kết hợp với ambrette và vetiver cát, chúng tôi tạo ra một hợp chất gợi lên cảm giác đứng giữa một công trình Le Corbusier vào buổi sáng sớm.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80",
        imageCaption: "Unité d'Habitation, Marseille — nguồn cảm hứng cho Bois Silencieux",
      },
      {
        heading: "Nước hoa như kiến trúc",
        body: "Thú vị nhất là cả kiến trúc Brutalist và nước hoa đều chia sẻ cùng một nguyên tắc cấu trúc: nền tảng phải đủ mạnh để chịu đựng thời gian. Một tòa nhà bê tông cần móng sâu; một nước hoa cần base notes đủ dày. Cả hai đều không quan tâm đến việc làm đẹp ngay lập tức — chúng muốn được hiểu dần dần.",
      },
      {
        heading: "Bois Silencieux — Kết quả",
        body: "Bois Silencieux ra đời từ thử nghiệm này. Hinoki wood và cold incense tạo nên cảm giác của một không gian rộng lớn, im lặng và đầy ánh sáng tự nhiên. Không phải mùi hương để gây ấn tượng từ xa — mà là thứ chỉ bộc lộ hoàn toàn khi bạn đến rất gần.",
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJMbwQSC1bTCc8zqEM39PIziojviFJfFSGLGMNKBVioA&s=10",
        imageCaption: "Bois Silencieux — ra mắt Thu Đông 2025",
      },
    ],
    relatedSlugs: ["visualizing-the-invisible-synesthesia", "ethics-of-extraction"],
  },
  {
    id: 3,
    slug: "ethics-of-extraction",
    category: "Bền vững",
    title: "Đạo đức trong chiết xuất: Bảo tồn những loài hoa đang bị đe dọa",
    description:
      "Câu chuyện về hợp tác của chúng tôi với các vườn bảo tồn địa phương nhằm bảo vệ những loài thực vật quý hiếm bằng công nghệ bền vững.",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS__htyuJgvZWWlJPkJTpMlgM6ej2uVAbxXjAnsUoiIEg&s=10",
    heroImage:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS__htyuJgvZWWlJPkJTpMlgM6ej2uVAbxXjAnsUoiIEg&s=10",
    date: "14 tháng 6, 2025",
    readTime: "10 phút đọc",
    author: "Amara Osei",
    sections: [
      {
        body: "Ngành nước hoa tiêu thụ hàng nghìn tấn nguyên liệu thực vật mỗi năm. Một số loài — như hoa nhài Sambac thuần chủng, hoa huệ tây hoang dã, hay gỗ đàn hương Mysore nguyên bản — đang đứng trước nguy cơ tuyệt chủng thương mại. Chúng tôi quyết định không nhắm mắt làm ngơ.",
      },
      {
        heading: "Hợp tác với vườn bách thảo",
        body: "Từ năm 2022, chúng tôi hợp tác với ba vườn bách thảo tại Pháp, Sri Lanka và Madagascar để xây dựng chương trình nhân giống và bảo tồn các loài hoa đang bị đe dọa. Không chỉ dừng ở việc thu mua công bằng — chúng tôi đầu tư vào cơ sở hạ tầng, đào tạo nông dân địa phương và nghiên cứu phương pháp chiết xuất ít xâm lấn hơn.",
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS__htyuJgvZWWlJPkJTpMlgM6ej2uVAbxXjAnsUoiIEg&s=10",
        imageCaption: "Vườn nhân giống hoa nhài Sambac, Sri Lanka — đối tác từ 2022",
      },
      {
        heading: "Công nghệ headspace: thu mùi hương mà không cắt hoa",
        body: "Một trong những tiến bộ quan trọng nhất là công nghệ headspace — cho phép thu thập phân tử mùi hương từ không khí xung quanh hoa đang sống mà không cần hái hay chưng cất. Kết quả là một bản sao phân tử gần như hoàn hảo của mùi hương tự nhiên, và cây hoa không bị tổn thương.",
      },
      {
        heading: "Cam kết đến 2030",
        body: "Đến năm 2030, chúng tôi cam kết 100% nguyên liệu thực vật đến từ nguồn được chứng nhận bền vững hoặc tổng hợp có trách nhiệm. Đây không phải marketing — đây là điều kiện để chúng tôi còn có nguyên liệu để làm việc trong hai mươi năm nữa.",
        image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200&q=80",
        imageCaption:
          "Chương trình trồng cây phục hồi tại Madagascar — mục tiêu 50,000 cây đến 2027",
      },
    ],
    relatedSlugs: ["molecular-poetry-cedarwood", "lost-art-scented-correspondence"],
  },
  {
    id: 4,
    slug: "molecular-poetry-cedarwood",
    category: "Khoa học",
    title: "Thi ca phân tử của gỗ tuyết tùng",
    description:
      "Tìm hiểu hóa học đằng sau nguyên liệu gỗ, xương sống của những mùi hương bền bỉ nhất thế giới.",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80",
    date: "2 tháng 6, 2025",
    readTime: "7 phút đọc",
    author: "Dr. Jean-Pierre Volat",
    sections: [
      {
        body: "Cedar — gỗ tuyết tùng — là một trong những nguyên liệu lâu đời nhất trong lịch sử nước hoa. Người Ai Cập cổ đại dùng nó để ướp xác. Người Babylon đốt nó trong các nghi lễ tôn giáo. Hàng nghìn năm sau, nó vẫn là base note không thể thiếu của hàng trăm thành phần nước hoa hiện đại. Tại sao?",
      },
      {
        heading: "Phân tử cedrol và thudopsene",
        body: "Sức hút của cedarwood nằm ở hai phân tử chủ chốt: cedrol và thudopsene. Cedrol — một sesquiterpene alcohol — mang lại sự ấm áp, gần gũi và hơi ngọt đặc trưng. Thudopsene tạo nên chiều sâu gỗ khô và sắc nét hơn. Sự kết hợp của hai phân tử này, theo tỷ lệ khác nhau tùy loài cedar, tạo ra những nhân vật hoàn toàn khác nhau.",
        image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80",
        imageCaption:
          "Rừng cedar Virginia — nguồn cung cấp Virginiana cedar cho bộ sưu tập của chúng tôi",
      },
      {
        heading: "Cedar trong bộ sưu tập của chúng tôi",
        body: "Chúng tôi sử dụng ba loại cedar khác nhau: Atlas cedar từ Morocco (ấm và nhựa cây), Virginia cedar từ Mỹ (khô và sắc nét), và Himalayan cedar (trầm mặc và tâm linh). Mỗi loại đóng một vai trò khác nhau. Atlas cedar là xương sống của Noir Intense. Virginia cedar tạo độ sắc nét cho Bleu de Chanel trong bộ sưu tập đa thương hiệu. Himalayan cedar — hiếm và đắt nhất — được dành riêng cho Velvet Oud.",
      },
      {
        heading: "Gỗ như nhân vật, không phải nền",
        body: "Lỗi phổ biến nhất trong pha chế nước hoa là đối xử với cedar như một tấm vải nền trung tính để đặt các nốt hương khác lên. Cedar không phải nền — nó là nhân vật. Khi được dùng đúng cách, nó đối thoại với từng nốt hương khác, thay đổi và được thay đổi bởi chúng.",
        image: "https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?w=1200&q=80",
        imageCaption: "Phòng thí nghiệm pha chế — nơi cedar gặp gỡ các nguyên liệu khác",
      },
    ],
    relatedSlugs: ["scenting-brutalism-cold-air", "visualizing-the-invisible-synesthesia"],
  },
  {
    id: 5,
    slug: "lost-art-scented-correspondence",
    category: "Phong cách sống",
    title: "Nghệ thuật thư tay tẩm hương đã mất",
    description:
      "Vì sao sự thân mật của một phong bì vương hương vẫn là một trong những cử chỉ kết nối mạnh mẽ nhất trong lịch sử.",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1600&q=80",
    date: "20 tháng 5, 2025",
    readTime: "5 phút đọc",
    author: "Céleste Fontaine",
    sections: [
      {
        body: "Trước khi có email, trước khi có điện thoại, người ta gửi cho nhau những phong bì thơm mùi hương. Một bức thư tẩm nước hoa hoa hồng từ Paris đến Vienna vào thế kỷ 18 mang theo không chỉ chữ viết — mà cả hơi thở của người viết, không khí của căn phòng nơi bức thư được viết, và một tuyên ngôn tình cảm không cần từ ngữ.",
      },
      {
        heading: "Lịch sử của thư thơm",
        body: "Thực hành tẩm hương cho thư từ có nguồn gốc từ ít nhất thế kỷ 16, khi các quý bà Pháp và Ý dùng nước hoa hoa nhài hoặc hoa cam để phân biệt thư của mình với những thư khác. Đến thế kỷ 19, nó trở thành một hình thức ngôn ngữ mã hóa — mỗi loài hoa, mỗi mùi hương mang một thông điệp cụ thể trong hệ thống 'floriography'.",
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80",
        imageCaption: "Bộ sưu tập thư từ thế kỷ 19 tại Thư viện Quốc gia Pháp",
      },
      {
        heading: "Tại sao nó biến mất",
        body: "Thư thơm biến mất không phải vì con người mất đi sự lãng mạn — mà vì tốc độ. Điện tín, rồi điện thoại, rồi email, rồi tin nhắn tức thì: mỗi bước tiến về tốc độ là một bước lùi về chiều sâu cảm giác. Chúng ta giao tiếp nhanh hơn bao giờ hết và ít hiện diện hơn bao giờ hết trong từng lời nói.",
      },
      {
        heading: "Phục hồi một truyền thống",
        body: "Chúng tôi ra mắt bộ giấy thư 'Correspondance' — được tẩm nhẹ một trong ba mùi hương: Rose Blanche (tình yêu lãng mạn), Noir Intense (kính trọng và ngưỡng mộ), hoặc Aqua Unisex (tình bạn và kết nối). Một bức thư tay, trên giấy thơm, vẫn là một trong những cử chỉ kết nối mạnh mẽ nhất mà con người có thể làm cho nhau.",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
        imageCaption: "Bộ giấy thư Correspondance — ra mắt tháng 8/2025",
      },
    ],
    relatedSlugs: ["ethics-of-extraction", "visualizing-the-invisible-synesthesia"],
  },

  // ─── 6 bài viết mới tương ứng với Olfactory Archetypes ───────────────────
  {
    id: 6,
    slug: "archetype-smoked-vetiver",
    category: "Tiêu điểm nguyên liệu",
    title: "Vetiver khói: Lớp đất dưới ngọn lửa",
    description:
      "Vetiver mang ký ức của đất sau mưa và lửa trại. Chúng tôi lần theo rễ hương cổ xưa này từ đồng cỏ Haiti đến xưởng pha chế.",
    image: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=1600&q=80",
    date: "5 tháng 7, 2025",
    readTime: "7 phút đọc",
    author: "Dr. Jean-Pierre Volat",
    sections: [
      {
        body: "Vetiver không phải là một mùi hương — nó là một địa điểm. Những ai đã từng ngửi rễ vetiver tươi sẽ nhận ra ngay: đất đỏ sau mưa, khói từ một đống lửa xa xa, và phía dưới tất cả là một thứ gì đó trầm, cổ xưa, gần như khoáng vật. Đó là lý do vetiver khói là một trong những nguyên liệu phức tạp nhất và trung thành nhất mà chúng tôi làm việc cùng.",
      },
      {
        heading: "Hành trình từ rễ đến nước hoa",
        body: "Vetiver được trồng chủ yếu ở Haiti, Java và Réunion — mỗi vùng đất cho ra một nhân cách khác nhau. Vetiver Haiti nổi tiếng về chiều sâu khói và đất; Java cho ra loại nhẹ hơn với nốt gỗ; Réunion mang hơi hướng hoa cỏ tinh tế. Chúng tôi chưng cất rễ bằng hơi nước trong 18 đến 24 giờ để chiết xuất tinh dầu — quá trình này không thể rút ngắn nếu muốn giữ trọn phổ phân tử.",
        image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80",
        imageCaption: "Rễ vetiver phơi khô trước khi chưng cất — Haiti",
      },
      {
        heading: "Tại sao chúng tôi hun khói nó",
        body: "Bước hun khói là nơi chúng tôi đưa ra một quyết định có chủ ý. Vetiver tự nhiên đã có hơi hướng khói nhẹ từ các phân tử khusimol và isovalencenol — chúng tôi khuếch đại chiều này bằng cách xông khói gỗ sồi nhẹ trước khi pha trộn. Kết quả là một nguyên liệu vừa quen vừa lạ: đất đai quen thuộc, nhưng mang theo ký ức của lửa.",
      },
      {
        heading: "Smoked Vetiver trong bộ sưu tập",
        body: "Nguyên liệu này là trụ cột của hai sáng tác trong bộ sưu tập Archetypes: Terre Noire và Cendres du Soir. Ở Terre Noire, nó là nền tảng tối của toàn bộ kim tự tháp mùi hương. Ở Cendres du Soir, nó được đẩy lên thành nhân vật chính — một nước hoa tối giản chỉ có ba thành phần, trong đó vetiver chiếm không gian đến 60%.",
        image: "https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?w=1200&q=80",
        imageCaption: "Cendres du Soir — khi vetiver là toàn bộ câu chuyện",
      },
    ],
    relatedSlugs: ["archetype-ancient-resin", "molecular-poetry-cedarwood"],
  },
  {
    id: 7,
    slug: "archetype-ancient-resin",
    category: "Tiêu điểm nguyên liệu",
    title: "Nhựa cây cổ đại: Ngôn ngữ của làn khói thiêng",
    description:
      "Nhũ hương, myrrh, labdanum - nhựa cây là những nguyên liệu nước hoa lâu đời nhất. Chúng tôi khám phá điều khiến chúng vượt thời gian.",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJKAx_T_e9r6qfkItNyyPv4s4viAzq_L3thp2h4W4k9w&s=10",
    heroImage:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJKAx_T_e9r6qfkItNyyPv4s4viAzq_L3thp2h4W4k9w&s=10",
    date: "19 tháng 6, 2025",
    readTime: "9 phút đọc",
    author: "Amara Osei",
    sections: [
      {
        body: "Nhựa cây là ngôn ngữ pha chế nước hoa cổ xưa nhất còn được dùng đến ngày nay. Frankincense đã được đốt trong các ngôi đền Ai Cập từ 3000 năm trước Công nguyên. Myrrh xuất hiện trong các văn bản y học Mesopotamia trước cả chữ viết có hệ thống. Labdanum được người Hy Lạp cổ đại thu hoạch từ lông dê — con vật gặm cỏ dã tràng và nhựa cây bám vào lông chúng. Chúng ta thừa hưởng toàn bộ di sản đó trong một chai nước hoa.",
      },
      {
        heading: "Ba loại nhựa cây trụ cột",
        body: "Frankincense (nhũ hương) từ Oman và Somalia mang hương thơm thanh khiết, không khí lạnh và trầm lặng của nhà thờ. Myrrh từ Ethiopia và Yemen đậm đà hơn, gần với da người và đất ẩm. Labdanum từ vùng Địa Trung Hải — được chưng cất từ cây Cistus ladanifer — mang mùi hổ phách ngọt ngào và da thuộc ấm áp. Ba loại này tạo thành một tam giác nhựa cây không thể thay thế trong phòng thí nghiệm của chúng tôi.",
        image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&q=80",
        imageCaption: "Hạt frankincense Oman loại hảo hạng — thu hoạch tháng 3 hàng năm",
      },
      {
        heading: "Tại sao nhựa cây tồn tại được hàng nghìn năm",
        body: "Nhựa cây bền vững không phải vì chúng không thay đổi — mà vì chúng thay đổi đúng cách. Các phân tử triterpene trong frankincense tiến hóa chậm khi tiếp xúc với không khí, tạo ra những chiều sâu mới theo thời gian. Đây là lý do một chai nước hoa nhựa cây được bảo quản tốt sẽ trở nên phức tạp hơn, không nhạt hơn, sau nhiều năm.",
      },
      {
        heading: "Ancient Resin Accord — pha trộn của chúng tôi",
        body: "Bộ sưu tập Ancient Resin Accord được xây dựng quanh một blend đặc biệt: frankincense Oman, myrrh Ethiopia, labdanum Tây Ban Nha, và một nốt benzoin Laos nhỏ để thêm chiều ấm ngọt. Không có một nốt hương nào chiếm ưu thế — đây là một hợp tấu, không phải một độc tấu.",
        image: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=1200&q=80",
        imageCaption: "Ancient Resin Accord — phiên bản mùa thu 2025",
      },
    ],
    relatedSlugs: ["archetype-smoked-vetiver", "archetype-sandalwood"],
  },
  {
    id: 8,
    slug: "archetype-highland-lavender",
    category: "Tiêu điểm nguyên liệu",
    title: "Lavender cao nguyên: Mùi hương của độ cao",
    description:
      "Lavender thật chỉ sinh trưởng trên độ cao hơn 800 mét. Chúng tôi khám phá vì sao độ cao biến loài hoa quen thuộc này thành điều phi thường.",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQms7H-rohIGVXMGswOospL49KfBax9mDIGFMr4iluH3g&s=10",
    heroImage:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQms7H-rohIGVXMGswOospL49KfBax9mDIGFMr4iluH3g&s=10",
    date: "30 tháng 5, 2025",
    readTime: "6 phút đọc",
    author: "Élise Moreau",
    sections: [
      {
        body: "Lavender là loài hoa quen thuộc đến mức người ta quên mất nó có thể phi thường đến mức nào. Phần lớn lavender trên thị trường là lavandin — giống lai được trồng ở độ cao thấp, cho năng suất cao, mùi hương đơn điệu và đôi khi gắt. Lavande vraie — lavender thực sự — chỉ sống trên cao nguyên Provence từ 800 đến 1800 mét. Và ở đó, mọi thứ khác đi hoàn toàn.",
      },
      {
        heading: "Tại sao độ cao tạo nên sự khác biệt",
        body: "Ở độ cao, cây lavender phát triển chậm hơn dưới áp lực của khí hậu khắc nghiệt — nhiệt độ chênh lệch lớn giữa ngày và đêm, đất nghèo dinh dưỡng, tia UV cao hơn. Để sinh tồn, cây tổng hợp nhiều hợp chất thơm hơn, đặc biệt là linalool và linalyl acetate tinh khiết hơn. Kết quả: mùi hương trong sáng, thảo mộc và hơi long não — rất khác với mùi xà phòng thông thường của lavandin.",
        image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80",
        imageCaption: "Cánh đồng lavender cao nguyên Valensole, Provence — tháng 7",
      },
      {
        heading: "Thu hoạch bằng tay",
        body: "Địa hình dốc của cao nguyên không cho phép máy móc thu hoạch. Mỗi bông lavender được cắt bằng tay vào buổi sáng sớm, trước khi nhiệt độ tăng và tinh dầu bốc hơi. Đây là lao động nặng nhọc, và nó phản ánh trong giá — nhưng cũng phản ánh trong chất lượng.",
      },
      {
        heading: "Lavender trong bộ sưu tập Archetypes",
        body: "Highland Lavender là nguyên liệu trung tâm của Clairière — một nước hoa floral-aromatic lấy cảm hứng từ buổi sáng trên cao nguyên Provence. Lavender cao nguyên kết hợp với rosemary Corsica, bergamot Calabria và một nốt vetiver nhẹ để giữ toàn bộ cấu trúc đứng vững. Không lãng mạn sến, không thảo dược y tế — chỉ là không khí trong và đất thơm.",
        image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80",
        imageCaption: "Clairière — ra mắt Xuân Hè 2026",
      },
    ],
    relatedSlugs: ["archetype-bitter-bergamot", "ethics-of-extraction"],
  },
  {
    id: 9,
    slug: "archetype-bitter-bergamot",
    category: "Tiêu điểm nguyên liệu",
    title: "Bergamot đắng: Ánh nắng ép vào làn da",
    description:
      "Vỏ bergamot Calabria chứa độ phức tạp vượt mọi loại cam quýt khác. Chúng tôi ghi lại mùa thu hoạch chỉ diễn ra một lần mỗi năm.",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgxMdfC1MN1eLPBymaHTM83hXvoyVXToC0jSjP3S4JVA&s=10",
    heroImage:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgxMdfC1MN1eLPBymaHTM83hXvoyVXToC0jSjP3S4JVA&s=10",
    date: "10 tháng 5, 2025",
    readTime: "5 phút đọc",
    author: "Marcus de Vries",
    sections: [
      {
        body: "Bergamot là loại quả kỳ lạ nhất trong họ cam quýt. Không ai ăn nó tươi — quá đắng, gần như không ăn được. Nhưng tinh dầu trong vỏ của nó là một trong những nguyên liệu nước hoa được sử dụng rộng rãi nhất thế giới, xuất hiện trong ít nhất 50% các nước hoa fine fragrance. Và 90% bergamot chất lượng cao nhất chỉ đến từ một dải hẹp 80 km dọc bờ biển Calabria, miền Nam Italy.",
      },
      {
        heading: "Mùa thu hoạch duy nhất",
        body: "Bergamot chỉ chín vào tháng 11 đến tháng 2 — và chỉ được thu hoạch một lần mỗi năm. Tinh dầu được chiết xuất ngay lập tức từ vỏ tươi bằng phương pháp ép lạnh (cold expression), không qua chưng cất nhiệt. Đây là lý do bergamot chất lượng cao có mùi sống động và tươi đến vậy — không có nhiệt độ nào làm biến đổi cấu trúc phân tử.",
        image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200&q=80",
        imageCaption: "Quả bergamot Calabria chín trên cây — tháng 12",
      },
      {
        heading: "Bergamot FCF và câu hỏi an toàn",
        body: "Bergamot tự nhiên chứa bergapten — một furanocoumarin có thể gây phản ứng da khi tiếp xúc ánh nắng. Tiêu chuẩn IFRA hiện tại yêu cầu sử dụng bergamot FCF (furanocoumarin-free) trong hầu hết ứng dụng. Chúng tôi dùng cả hai: bergamot tự nhiên trong các sáng tác dành cho mùa đông và ban đêm; FCF trong bộ sưu tập mùa hè.",
      },
      {
        heading: "Bitter Bergamot trong bộ sưu tập",
        body: "Đặc tính đắng của bergamot — thường bị che đi trong các nước hoa thương mại — là điều chúng tôi chủ ý khai thác. Kết hợp với neroli Grasse và petit grain Morocco, chúng tôi tạo ra Zeste Amer — một nước hoa citrus khắc nghiệt và trưởng thành. Không ngọt, không dễ chịu ngay từ đầu — nhưng sau 20 phút trên da, nó mở ra thành thứ gì đó ấm áp và không thể thiếu.",
        image: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=1200&q=80",
        imageCaption: "Zeste Amer — khi đắng là một lựa chọn thẩm mỹ",
      },
    ],
    relatedSlugs: ["archetype-highland-lavender", "archetype-damask-rose"],
  },
  {
    id: 10,
    slug: "archetype-damask-rose",
    category: "Tiêu điểm nguyên liệu",
    title: "Hoa hồng Damask: Nữ hoàng chỉ nở lúc bình minh",
    description:
      "Mỗi vụ thu hoạch bắt đầu trước khi mặt trời mọc. Chúng tôi đến Thung lũng Hoa hồng Bulgaria để chứng kiến khoảnh khắc rực rỡ ngắn ngủi của Rosa damascena.",
    image:
      "https://www.thisisdimashq.com/wp-content/uploads/2025/09/530350225_122133517022864116_8041839167718942976_n-1024x576.jpg",
    heroImage:
      "https://www.thisisdimashq.com/wp-content/uploads/2025/09/530350225_122133517022864116_8041839167718942976_n-1024x576.jpg",
    date: "25 tháng 4, 2025",
    readTime: "8 phút đọc",
    author: "Céleste Fontaine",
    sections: [
      {
        body: "Một kg tinh dầu hoa hồng Damask cần từ 3 đến 5 tấn cánh hoa. Mỗi bông hoa phải được hái bằng tay trước 10 giờ sáng, trước khi nhiệt độ tăng và tinh dầu bắt đầu bốc hơi. Mùa hái hoa chỉ kéo dài từ 3 đến 4 tuần mỗi năm. Đây là lý do dầu hoa hồng thuần chất là một trong những nguyên liệu nước hoa đắt nhất thế giới — và không có gì thay thế được nó hoàn toàn.",
      },
      {
        heading: "Thung lũng Hoa hồng Bulgaria",
        body: "Thung lũng Kazanlak ở Bulgaria — được gọi là Thung lũng Hoa hồng — cung cấp khoảng 70% sản lượng dầu hoa hồng Damask toàn cầu. Đất đỏ, khí hậu ôn hòa và kỹ thuật canh tác được truyền từ thế kỷ 17 tạo ra điều kiện không thể tái tạo ở nơi khác. Chúng tôi hợp tác trực tiếp với ba gia đình trồng hoa lâu đời nhất vùng — không qua trung gian.",
        image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80",
        imageCaption: "Thung lũng Kazanlak lúc bình minh — bắt đầu một ngày hái hoa",
      },
      {
        heading: "Rose Otto và Rose Absolute — hai nhân vật khác nhau",
        body: "Cùng một loài hoa, hai phương pháp chiết xuất cho ra hai nguyên liệu hoàn toàn khác nhau. Rose Otto — chưng cất hơi nước — cho ra tinh dầu thanh khiết, trong sáng, hơi sáp và rất trung thực với mùi hoa tươi. Rose Absolute — chiết xuất dung môi — đậm đà hơn, phức tạp hơn, với chiều sâu mật ong và thuốc lá nhẹ. Chúng tôi dùng cả hai trong các sáng tác khác nhau.",
      },
      {
        heading: "Damask Rose trong bộ sưu tập",
        body: "Rose Blanche sử dụng Rose Otto Bulgaria làm trung tâm — xung quanh là geranium Bourbon, lychee và patchouli nhẹ. Đây là hoa hồng của ánh sáng ban ngày và sự trong sáng. Rose Profonde dùng Rose Absolute kết hợp với oud Assam và ambrette — hoa hồng của đêm và bí ẩn. Cùng một loài hoa, hai cuộc sống hoàn toàn khác nhau.",
        image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80",
        imageCaption: "Rose Blanche và Rose Profonde — hai mặt của Damask",
      },
    ],
    relatedSlugs: ["archetype-highland-lavender", "ethics-of-extraction"],
  },
  {
    id: 11,
    slug: "archetype-sandalwood",
    category: "Tiêu điểm nguyên liệu",
    title: "Đàn hương: Loại gỗ giữ mọi tầng hương lại với nhau",
    description:
      "Đàn hương Mysore đã bị khai thác quá mức trong nhiều thập kỷ. Chúng tôi tìm hiểu các lựa chọn bền vững và điều không thể thay thế của nguyên bản.",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80",
    date: "8 tháng 4, 2025",
    readTime: "8 phút đọc",
    author: "Dr. Jean-Pierre Volat",
    sections: [
      {
        body: "Đàn hương Mysore — Santalum album từ miền Nam Ấn Độ — từng là tiêu chuẩn vàng của nước hoa toàn cầu. Mùi hương của nó là sự kết hợp hiếm có: ấm áp và sữa, gỗ và da, hoa và đất — tất cả trong một. Nhưng hàng thập kỷ khai thác không kiểm soát đã đưa loài cây này đến bờ vực. Hôm nay, Mysore sandalwood thuần chất gần như không còn trên thị trường — và nếu có, giá của nó khiến ngay cả các thương hiệu nước hoa lớn cũng phải cân nhắc.",
      },
      {
        heading: "Các lựa chọn thay thế bền vững",
        body: "Santalum spicatum từ Tây Australia là lựa chọn được chứng nhận bền vững phổ biến nhất hiện nay — khô hơn, ít sữa hơn Mysore, nhưng đứng vững và dễ làm việc. Santalum austrocaledonicum từ New Caledonia gần hơn với Mysore về mặt hóa học. Và gần đây, Santalum paniculatum từ Hawaii — được trồng dưới sự giám sát chặt chẽ — đang nổi lên như một nhân vật mới trong câu chuyện đàn hương.",
        image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80",
        imageCaption: "Rừng Santalum spicatum tại Tây Australia — được chứng nhận FSC",
      },
      {
        heading: "Santalol và lý do đàn hương giữ mùi",
        body: "Phân tử chủ chốt của đàn hương là alpha-santalol và beta-santalol — hai sesquiterpene alcohol có khả năng bám dính da đặc biệt mạnh. Đây là lý do đàn hương là một fixative lý tưởng: nó không chỉ có mùi hương của chính nó mà còn 'giữ' các mùi hương khác lại trên da, kéo dài sức sống của toàn bộ hợp chất.",
      },
      {
        heading: "Sandalwood trong bộ sưu tập Archetypes",
        body: "Chúng tôi sử dụng một blend của hai loại: Santalum spicatum Australia để tạo khung gỗ bền vững, và một lượng nhỏ Mysore từ nguồn được chứng nhận hợp pháp để thêm chiều sâu sữa không thể tái tạo. Kết quả là Santal Doux — nước hoa gỗ đơn giản nhất và trung thực nhất chúng tôi từng làm. Không có gì che giấu, không có gì thêm vào để gây ấn tượng. Chỉ là gỗ và thời gian.",
        image: "https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?w=1200&q=80",
        imageCaption: "Santal Doux — khi sự giản dị là tham vọng lớn nhất",
      },
    ],
    relatedSlugs: ["archetype-ancient-resin", "molecular-poetry-cedarwood"],
  },
  {
    id: 12,
    slug: "archetype-oud-assam",
    category: "Tiêu điểm nguyên liệu",
    title: "Oud Assam: Vàng lỏng của rừng sâu",
    description:
      "Oud là nguyên liệu thô quý giá nhất trong nước hoa. Chúng tôi theo dõi hành trình gỗ trầm bị nhiễm nấm chậm rãi biến thành vàng lỏng.",
    image: "https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?w=1600&q=80",
    date: "2 tháng 4, 2025",
    readTime: "9 phút đọc",
    author: "Dr. Jean-Pierre Volat",
    sections: [
      {
        body: "Oud không phải là mùi hương sinh ra từ sự khỏe mạnh, nó sinh ra từ tổn thương. Khi cây trầm hương Aquilaria bị nhiễm một loại nấm đặc biệt, nó tiết ra một loại nhựa sẫm màu để tự bảo vệ. Chính phần gỗ tẩm nhựa đó, sau hàng chục năm, trở thành oud. Đây là lý do oud vừa quý vừa mang chiều sâu gần như không thể mô tả bằng ngôn từ.",
      },
      {
        heading: "Vì sao oud đắt đến vậy",
        body: "Chỉ khoảng 2 phần trăm cây trầm hương hoang dã tự nhiên tạo ra nhựa oud, và quá trình hình thành kéo dài hàng thập kỷ. Sự khan hiếm cộng với nhu cầu không ngừng tăng ở Trung Đông và châu Á khiến oud trở thành nguyên liệu đắt nhất ngành nước hoa, có thể vượt cả vàng tính theo trọng lượng.",
        image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80",
        imageCaption: "Gỗ trầm hương chứa nhựa oud, Assam - Ấn Độ",
      },
      {
        heading: "Oud Assam và tính cách riêng",
        body: "Oud từ vùng Assam và Bắc Ấn mang tính cách ấm, mật ong và hơi da thuộc, khác với oud Campuchia sáng và ngọt hơn hay oud Borneo mang hương gỗ tươi. Chúng tôi chọn Assam cho các sáng tác cần chiều sâu trầm và tối.",
      },
      {
        heading: "Oud trong bộ sưu tập Archetypes",
        body: "Nước hoa Nuit Boisêe đặt oud Assam làm trung tâm, bao quanh bởi hoa hồng Damask và một chút saffron. Đây không phải mùi hương để tiếp cận ngay, nó đòi hỏi thời gian, nhưng một khi đã quen thì khó mà quay lại với bất kỳ thứ gì khác.",
        image: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=1200&q=80",
        imageCaption: "Nuit Boisêe - khi oud gặp hoa hồng",
      },
    ],
    relatedSlugs: ["archetype-ancient-resin", "archetype-sandalwood"],
  },
  {
    id: 13,
    slug: "archetype-ambergris",
    category: "Tiêu điểm nguyên liệu",
    title: "Long diên hương: Thuật giả kim chậm rãi của đại dương",
    description:
      "Sinh ra từ biển và được nắng cùng muối ủ trong nhiều năm, long diên hương là một trong những nguyên liệu kỳ lạ và mê hoặc nhất của nước hoa.",
    image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1600&q=80",
    date: "22 tháng 3, 2025",
    readTime: "7 phút đọc",
    author: "Amara Osei",
    sections: [
      {
        body: "Long diên hương - ambergris - có một nguồn gốc kỳ lạ nhất trong ngành nước hoa. Nó hình thành trong đường ruột cá nhà táng, rồi trôi nổi trên đại dương hàng năm trời. Dưới tác động của nước biển, ánh nắng và thời gian, khối vật thô ban đầu biến thành một chất sáp thơm có mùi ấm, mặn và ngọt diệu kỳ.",
      },
      {
        heading: "Thuật giả kim của biển cả",
        body: "Ambergris tươi gần như không thể ngửi được. Chỉ sau nhiều năm oxy hóa tự nhiên trên mặt biển, nó mới phát triển mùi hương đặc trưng: một sự pha trộn giữa da người ấm, khói biển mặn và một nét ngọt gần như không thể gọi tên. Đây là ví dụ hoàn hảo cho việc thời gian là một thành phần trong nước hoa.",
        image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80",
        imageCaption: "Bờ biển nơi ambergris được tìm thấy sau nhiều năm trôi dạt",
      },
      {
        heading: "Ambroxan và các lựa chọn có đạo đức",
        body: "Vì ambergris tự nhiên vừa hiếm vừa liên quan đến việc bảo tồn cá nhà táng, hầu hết ngành nước hoa hiện đại dùng Ambroxan - một phân tử tổng hợp tái tạo nét ấm, mặn và tỏa của ambergris mà không ảnh hưởng đến động vật. Chúng tôi dùng Ambroxan cho gần như toàn bộ các sáng tác.",
      },
      {
        heading: "Ambergris trong bộ sưu tập",
        body: "Peau de Sel sử dụng Ambroxan làm nền, kết hợp với muối biển và một chút xạ hương trắng, tái tạo cảm giác làn da ấm sau một ngày ngoài biển. Đây là một trong những mùi hương gần gũi nhất mà chúng tôi từng tạo ra.",
        image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80",
        imageCaption: "Peau de Sel - mùi hương của làn da và biển",
      },
    ],
    relatedSlugs: ["archetype-sea-salt", "archetype-sandalwood"],
  },
  {
    id: 14,
    slug: "archetype-tonka-bean",
    category: "Tiêu điểm nguyên liệu",
    title: "Đậu tonka: Hơi ấm có bóng tối",
    description:
      "Vani, hạnh nhân, thuốc lá và cỏ khô trong một hạt nhỏ. Đậu tonka là nốt hương ấm nhất trong nước hoa, và cũng dễ bị hiểu lầm nhất.",
    image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1600&q=80",
    date: "11 tháng 3, 2025",
    readTime: "6 phút đọc",
    author: "Céleste Fontaine",
    sections: [
      {
        body: "Hạt tonka - hạt của cây Dipteryx odorata vùng Nam Mỹ - là một trong những nguyên liệu ấm áp nhất trong bảng màu nước hoa. Trong một hạt nhỏ bé, bạn có thể tìm thấy vani, hạnh nhân, thuốc lá, cỏ khô và một nét ngọt ấm gần như ẩm thực. Nhưng phía sau sự ấm áp đó luôn có một bóng tối nhẹ.",
      },
      {
        heading: "Coumarin - phân tử khai sinh nước hoa hiện đại",
        body: "Tonka giàu coumarin, phân tử tạo nên mùi cỏ khô vừa cắt. Năm 1882, coumarin tổng hợp đầu tiên được dùng trong Fougère Royale, mở ra kỷ nguyên nước hoa hiện đại. Như vậy tonka không chỉ là một nguyên liệu, nó là một phần của lịch sử nghề pha chế.",
        image: "https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?w=1200&q=80",
        imageCaption: "Hạt tonka phơi khô trước khi ngâm chiết",
      },
      {
        heading: "Tonka trong bộ sưu tập",
        body: "Ombre Douce đặt tonka cạnh bên cà phê rang và một chút oakmoss, tạo ra một mùi hương ấm như buổi chiều mùa đông. Tonka ở đây không ngọt gắt, nó được giữ lại bởi nét khô và tối để trở nên trưởng thành.",
        image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80",
        imageCaption: "Ombre Douce - ấm áp có chiều sâu",
      },
    ],
    relatedSlugs: ["archetype-tobacco-leaf", "archetype-sandalwood"],
  },
  {
    id: 15,
    slug: "archetype-iris-pallida",
    category: "Tiêu điểm nguyên liệu",
    title: "Iris Pallida: Sự im lặng đắt giá nhất",
    description:
      "Bơ iris mất sáu năm để tạo thành và đắt hơn vàng. Chúng tôi khám phá vì sao kiên nhẫn mới là nguyên liệu thật sự.",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600&q=80",
    date: "28 tháng 2, 2025",
    readTime: "7 phút đọc",
    author: "Élise Moreau",
    sections: [
      {
        body: "Iris - hay chính xác hơn là orris - không đến từ hoa mà từ rễ củ. Và để rễ củ iris tỏa hương, nó phải được phơi khô và ủ trong ít nhất ba năm, đôi khi đến sáu năm. Kết quả là orris butter, một trong những nguyên liệu đắt nhất thế giới, đắt hơn vàng tính theo trọng lượng.",
      },
      {
        heading: "Sáu năm cho một mùi hương",
        body: "Trong thời gian ủ, các phân tử irone dần hình thành, tạo nên mùi hương đặc trưng của iris: bột phấn, gỗ lạnh, một chút rễ cây và một nét kim loại tinh khiết. Không có cách nào rút ngắn quá trình này. Iris dạy sự kiên nhẫn của chính nó.",
        image: "https://images.unsplash.com/photo-1490750967868-88df5691cc87?w=1200&q=80",
        imageCaption: "Rễ củ iris pallida phơi khô tại Tuscany",
      },
      {
        heading: "Iris trong bộ sưu tập",
        body: "Poudre Grise đưa iris pallida lên vị trí trung tâm, bao quanh bởi xạ hương trắng và một chút carrot seed. Đây là mùi hương của sự im lặng sang trọng, không phô trương, chỉ dành cho những ai chịu dừng lại đủ lâu để cảm nhận.",
        image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80",
        imageCaption: "Poudre Grise - sự im lặng đắt giá",
      },
    ],
    relatedSlugs: ["archetype-damask-rose", "archetype-highland-lavender"],
  },
  {
    id: 16,
    slug: "archetype-sea-salt",
    category: "Tiêu điểm nguyên liệu",
    title: "Muối biển: Mùi hương của khoảng cách",
    description:
      "Làm sao để đóng chai đường chân trời? Chúng tôi khám phá các phân tử tái tạo vị muối, bụi nước và không khí mở.",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&q=80",
    date: "16 tháng 2, 2025",
    readTime: "5 phút đọc",
    author: "Marcus de Vries",
    sections: [
      {
        body: "Muối biển không có mùi theo nghĩa hóa học thông thường. Cái mà chúng ta gọi là mùi biển thực ra là một hợp tấu của tảo biển, khoáng chất ẩm và không khí mở rộng. Tái tạo được cảm giác đó là một trong những thử thách thú vị nhất của nghề pha chế hiện đại.",
      },
      {
        heading: "Phân tử của không gian",
        body: "Các phân tử như Calone tạo ra nét dưa hấu và không khí biển, trong khi Ambroxan và một chút xạ hương tạo cảm giác mặn và tỏa rộng. Kết hợp lại, chúng gợi lên không phải mùi của nước, mà mùi của khoảng cách - của đường chân trời.",
        image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200&q=80",
        imageCaption: "Đường chân trời - nguồn cảm hứng cho Grand Large",
      },
      {
        heading: "Muối biển trong bộ sưu tập",
        body: "Grand Large kết hợp muối biển với bergamot và một nền gỗ nhạt, tạo ra một mùi hương thoáng, sáng và rộng. Đây là mùi hương của tự do, của những buổi sáng mở cửa sổ nhìn ra biển.",
        image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80",
        imageCaption: "Grand Large - mùi hương của tự do",
      },
    ],
    relatedSlugs: ["archetype-ambergris", "archetype-bitter-bergamot"],
  },
  {
    id: 17,
    slug: "archetype-tobacco-leaf",
    category: "Tiêu điểm nguyên liệu",
    title: "Lá thuốc lá: Khói mật ong và thư viện cũ",
    description:
      "Lá thuốc lá sau ủ có mùi mật ong, trái cây khô và giấy cũ. Chúng tôi lần theo hành trình của nó từ cánh đồng đến mùi hương.",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80",
    date: "4 tháng 2, 2025",
    readTime: "6 phút đọc",
    author: "Dr. Jean-Pierre Volat",
    sections: [
      {
        body: "Lá thuốc lá sau khi ủ lên men không còn liên quan gì đến điếu thuốc. Nó mang mùi mật ong, trái cây khô, da thuộc và giấy cũ - một mùi hương ấm và cổ điển như bước vào một thư viện lâu năm. Đây là một trong những nguyên liệu ấm, nam tính và sang trọng nhất.",
      },
      {
        heading: "Nghệ thuật ủ lá",
        body: "Quá trình curing - ủ và lên men lá thuốc lá - mới là nơi mùi hương thật sự hình thành. Đường tự nhiên trong lá caramel hóa, các hợp chất thơm phát triển chiều sâu mật ong và cỏ khô. Loại lá và cách ủ quyết định hoàn toàn tính cách cuối cùng.",
        image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80",
        imageCaption: "Lá thuốc lá ủ lên men - bước quyết định mùi hương",
      },
      {
        heading: "Thuốc lá trong bộ sưu tập",
        body: "Cuir et Miel kết hợp lá thuốc lá với tonka và một nét da thuộc, tạo ra một mùi hương ấm như một chiếc ghế da trong thư viện. Đây là mùi hương của mùa thu, của sách và của những buổi tối dài.",
        image: "https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?w=1200&q=80",
        imageCaption: "Cuir et Miel - khói ngọt và giấy cũ",
      },
    ],
    relatedSlugs: ["archetype-tonka-bean", "archetype-ancient-resin"],
  },
];

/**
 * Map từ tên Archetype → slug bài viết tương ứng.
 * Dùng trong Blog.tsx để link slider về trang chi tiết bài viết.
 */
export const ARCHETYPE_SLUG_MAP: Record<string, string> = {
  "Smoked Vetiver": "archetype-smoked-vetiver",
  "Ancient Resin": "archetype-ancient-resin",
  "Highland Lavender": "archetype-highland-lavender",
  "Bitter Bergamot": "archetype-bitter-bergamot",
  "Damask Rose": "archetype-damask-rose",
  Sandalwood: "archetype-sandalwood",
  "Oud Assam": "archetype-oud-assam",
  Ambergris: "archetype-ambergris",
  "Tonka Bean": "archetype-tonka-bean",
  "Iris Pallida": "archetype-iris-pallida",
  "Sea Salt": "archetype-sea-salt",
  "Tobacco Leaf": "archetype-tobacco-leaf",
};

export interface ArchetypeCard {
  name: string;
  image: string;
  slug: string;
}

const SLUG_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(ARCHETYPE_SLUG_MAP).map(([name, slug]) => [slug, name]),
);

// Slider Olfactory Archetypes lấy trực tiếp từ bài viết để dùng đúng ảnh trong blogData.
export const ARCHETYPES: ArchetypeCard[] = BLOG_ARTICLES.filter((a) =>
  a.slug.startsWith("archetype-"),
).map((a) => ({
  name: SLUG_TO_NAME[a.slug] ?? a.title,
  image: a.image,
  slug: a.slug,
}));
