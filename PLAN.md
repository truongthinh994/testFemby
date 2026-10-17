# Hoàn thiện Figma và triển khai TOEIC Learning MVP

## Tiến độ thực tế cập nhật 17/10/2026

**Phạm vi đã chốt với người dùng: hoàn tất bản local trước.** Chưa kết nối Supabase thật; các mục Figma còn lại làm sau mốc local.

**Mốc local đã nghiệm thu:** 21 kiểm thử logic/SQL/local API, 8 luồng trình duyệt (6 Chromium và 2 trên Microsoft Edge), typecheck, lint và build đều đạt. Đã thử mở/dừng/mở lại toàn bộ ứng dụng bằng lệnh local và đọc lại điểm đã lưu.

- [x] Có lệnh `npm run local`, tài khoản mẫu, nhãn bản local và hộp thư mô phỏng; không cần khóa Supabase.
- [x] Chạy local bằng bản biên dịch tối ưu; giảm tải lại dữ liệu toàn ứng dụng khi học; kiểm tra menu Từ vựng, flashcard và tải lại trên Edge với hồ sơ thử riêng. Chưa tái hiện lỗi đứng yên trong phiên Edge ban đầu của người dùng.
- [x] Tiến độ, tài khoản, mật khẩu thử và kết quả được giữ sau khởi động lại; kiểm thử bằng cơ sở dữ liệu lưu trên đĩa.
- [x] Sửa lỗi biên dịch và lint; chuẩn hóa kết nối Supabase và xử lý điều hướng/tài khoản.
- [x] Hoàn thiện lưu đáp án khi bấm nhanh/mất mạng, tiếp tục lượt thi, tự nộp và lịch sử/lời giải.
- [x] Bổ sung migration 002 bảo vệ phiên học, lưu lịch ôn và tiếp tục phiên chưa hoàn tất.
- [x] Kiểm thử SQL/RLS bằng PostgreSQL cục bộ và E2E bằng tài khoản/email mô phỏng; typecheck, lint và build.
- [x] Kiểm tra giao diện ở 360, 390, 768, 1024 và 1440px; dialog/bàn phím/audio lỗi.
- [x] Thêm README, bảng điều hướng và báo cáo tại docs/verification.md.
- [x] Sửa một phần prototype Figma và xuất bảng liên kết hiện tại. Trang Prototype có Section Web MVP/Mobile MVP vì gói Figma giới hạn ba trang.
- [ ] Hoàn tất nghiệm thu từng frame/state Figma, chọn đáp án tương tác, tên file và URL nguồn trước duplicate.
- [ ] Kết nối Supabase thật và nghiệm thu email/PKCE, dữ liệu sau đăng nhập lại, hai tài khoản và cạnh tranh nhiều kết nối.
- [ ] Xác nhận quyền phân phối giọng đọc audio trước công khai.

**Mốc local:** chạy `npm run local` và mở http://127.0.0.1:3000 để dùng. Supabase thật, nghiệm thu Figma đầy đủ và việc công khai website để giai đoạn sau. Chưa đánh dấu toàn bộ PLAN hoàn thành.


## 1. Phạm vi và kết quả bàn giao

Xây dựng **web responsive cho người học**, dùng **Next.js + TypeScript + Supabase Auth/PostgreSQL**.

Luồng chính gồm đăng nhập, trang chủ, học từ vựng, thi thử, kết quả và lời giải. Mini test gồm **20 câu nghe/đọc**, chấm số câu đúng và tỷ lệ đúng, không quy đổi sang thang điểm TOEIC 990.

Bàn giao:
- Bản sao Figma được hoàn thiện, có prototype desktop và mobile.
- Bảng ánh xạ màn hình, nút bấm và đường dẫn.
- Mã nguồn full-stack, migration, dữ liệu mẫu và hướng dẫn chạy.
- Kết quả kiểm thử giao diện, chức năng và phân quyền dữ liệu.

Admin, AI chat, ngữ pháp và ứng dụng mobile native để giai đoạn sau.

## 2. Thực hiện tuần tự 6 bước

### Bước 1 — Tạo bản sao Figma

- Duplicate toàn bộ file gốc thành **“TOEIC Learning App — Web MVP v2”**, giữ nguyên bản gốc.
- Thực hiện Duplicate bằng giao diện Figma; công cụ kết nối hiện không có thao tác duplicate toàn file trực tiếp. Nếu tài khoản không được phép sao chép, yêu cầu chủ file cấp quyền hoặc cung cấp bản duplicate trước khi sửa thiết kế.
- Ghi lại URL nguồn và URL bản sao. Đối chiếu các trang, frame, component và tài nguyên sau sao chép.
- Trong bản sao, tổ chức các trang: `Reference`, `Foundations`, `Web MVP`, `Mobile MVP`, `Prototype`.

**Nghiệm thu:** có file mới độc lập, nội dung nguồn đầy đủ và có quyền chỉnh sửa.

### Bước 2 — Chốt màn hình và điều hướng

Tận dụng các màn web W1–W3, W5–W8, W10–W12 và màn mobile tương ứng; bổ sung màn còn thiếu.

| Màn hình | Hành động chính → Đích đến |
|---|---|
| Đăng nhập | Thành công → Trang chủ; Đăng ký → Form đăng ký; Quên mật khẩu → Khôi phục |
| Trang chủ | Học từ vựng → Chọn chủ đề/ôn tập; Thi thử → Danh sách đề; Lịch sử → Các lần thi |
| Chọn chủ đề/ôn tập | Bắt đầu → Flashcard |
| Flashcard | Lật thẻ; nghe phát âm; tự đánh giá → Thẻ tiếp theo; hoàn thành → Quiz 5 câu |
| Quiz từ vựng | Nộp → Tổng kết phiên học → Tiếp tục học hoặc Trang chủ |
| Danh sách đề | Chọn đề → Hướng dẫn và xác nhận bắt đầu |
| Làm bài | Trước/sau/chọn số câu → Câu tương ứng; Nộp → Popup xác nhận |
| Kết quả | Xem lời giải → Chi tiết từng câu; Làm lại → Lượt thi mới; Trang chủ |
| Lời giải | Câu trước/sau; lọc câu sai; quay lại kết quả |
| Lịch sử | Chọn lần thi → Kết quả đã lưu |

- Lập bảng cho từng nút: frame nguồn, hành động, đích, điều kiện và trạng thái lỗi.
- Menu MVP chỉ hiển thị tính năng được triển khai.
- Chốt tài liệu luồng và thiết kế trước khi bắt đầu code.

**Nghiệm thu:** mọi nút trong phạm vi đều có hành vi rõ ràng, không có ngõ cụt.

### Bước 3 — Hoàn thiện frame và trạng thái

- Giữ phong cách thiết kế hiện tại; chuẩn hóa màu, typography, spacing và component dùng chung.
- Tạo variant cho button, input, đáp án, flashcard, thông báo và modal.
- Bổ sung đăng ký, quên/đặt lại mật khẩu, hướng dẫn xác nhận email và tổng kết phiên học.
- Bổ sung trạng thái loading, lỗi nhập liệu, sai thông tin đăng nhập, lỗi mạng/thử lại, chưa có lịch sử, chưa có từ cần ôn và audio không tải được.
- Tạo popup nộp bài có số câu chưa trả lời; popup thoát bài giải thích cách tiếp tục lượt thi.
- Phân biệt đáp án đang chọn, đáp án đúng và đáp án sai bằng cả chữ/icon lẫn màu.

**Nghiệm thu:** mỗi màn có trạng thái bình thường và các trạng thái phụ cần cho code.

### Bước 4 — Auto Layout, Constraints và responsive

- Dùng Auto Layout cho cấu trúc trang, danh sách, form, nhóm nút và nội dung modal.
- Nội dung giãn theo chiều ngang; text tự xuống dòng và tăng chiều cao. Icon giữ kích thước cố định.
- Desktop dùng vùng nội dung tối đa 1200px; mobile chuyển về một cột.
- Thanh thao tác khi thi giữ dễ tiếp cận, không che câu hỏi; bảng số câu chuyển thành drawer trên mobile.
- Dùng frame riêng cho bố cục desktop/mobile khi cần đổi cấu trúc; không kỳ vọng Constraints tự tạo breakpoint.
- Kiểm tra ở các chiều rộng **360, 390, 768, 1024 và 1440px**, kèm nội dung dài.

**Nghiệm thu:** không tràn ngang, cắt chữ, chồng lớp hoặc mất nút thao tác.

### Bước 5 — Nối và kiểm tra prototype

- Tạo điểm bắt đầu desktop và mobile.
- Nối đầy đủ hai luồng: học từ vựng và thi thử.
- Dùng overlay cho popup/drawer; nối thao tác mở, đóng, hủy và xác nhận.
- Mô phỏng chọn đáp án, lật thẻ, lỗi form và kết quả bằng variant/frame trạng thái.
- Prototype dùng dữ liệu minh họa; xác thực, đồng hồ và lưu dữ liệu thật được nghiệm thu ở bản code.
- Bấm thử từ đầu đến cuối, sửa liên kết sai và ghi lại phiên bản thiết kế đã chốt.

**Nghiệm thu:** hoàn thành được cả hai luồng trên prototype mà không phải chọn frame thủ công.

### Bước 6 — Triển khai full-stack theo thiết kế đã chốt

**Giao diện và tài khoản**
- Dùng Next.js App Router, TypeScript và Tailwind; chuyển token/component Figma thành thành phần tái sử dụng.
- Supabase Auth xử lý email/mật khẩu, xác nhận email, khôi phục mật khẩu và đăng xuất.
- Bảo vệ trang học tập; người chưa đăng nhập được chuyển về đăng nhập rồi quay lại đích ban đầu.

**Học từ vựng**
- Chủ đề → flashcard → tự đánh giá → quiz 5 câu → tổng kết.
- Lưu tiến độ và lịch ôn theo người dùng; MVP dùng lịch đơn giản: chưa thuộc ôn lại trong phiên, mơ hồ sau 1 ngày, đã thuộc sau 3 ngày.
- Trang chủ tổng hợp số từ đã học, từ đến hạn ôn và kết quả thi gần nhất.

**Thi thử**
- Đề mẫu 20 câu: 10 Listening, 10 Reading, thời lượng 20 phút.
- Audio có phát/tạm dừng/nghe lại; đây là chế độ luyện tập.
- Tự lưu đáp án lên server; hiển thị trạng thái đang lưu, đã lưu hoặc lỗi.
- Tải lại trang tiếp tục cùng lượt thi và cùng thời hạn; hết giờ chấm các đáp án đã lưu.
- Chấm bài trên server; nộp lặp không tạo kết quả trùng. Câu bỏ trống tính là sai.
- Sau nộp bài mới trả đáp án đúng, lời giải và transcript.

**Nghiệm thu:** tài khoản thật hoàn thành được luồng học và thi, đăng nhập lại vẫn thấy dữ liệu đã lưu.

## 3. Dữ liệu và giao diện xử lý

- Các nhóm dữ liệu chính: hồ sơ, chủ đề/từ vựng, tiến độ từ vựng, phiên học/quiz, đề thi/nhóm câu hỏi, lượt thi, đáp án và kết quả.
- Nhóm câu hỏi hỗ trợ dùng chung audio hoặc đoạn đọc.
- Các thao tác server: tạo/hoàn tất phiên học, ghi nhận tự đánh giá, bắt đầu lượt thi, lưu đáp án, nộp bài và đọc kết quả.
- Tách đáp án đúng/lời giải khỏi dữ liệu câu hỏi trả về khi đang thi.
- Áp dụng Supabase RLS: người dùng chỉ truy cập tiến độ, lượt thi và kết quả của mình; khóa quản trị chỉ nằm phía server.
- Chuẩn bị migration và seed tái chạy được: 3 chủ đề, tổng 30 từ và 1 mini test 20 câu kèm audio/lời giải có quyền sử dụng.

## 4. Kiểm thử và điều kiện hoàn thành

- **Unit:** tính điểm, câu bỏ trống, lịch ôn, hết giờ và nộp bài lặp.
- **Integration:** đăng nhập, lưu/đọc tiến độ, tiếp tục lượt thi, phân quyền giữa hai tài khoản, không lộ đáp án trước khi nộp.
- **E2E:** đăng ký/đăng nhập → học → quiz; đăng nhập → thi → kết quả → lời giải → xem lại lịch sử.
- **Tình huống lỗi:** mất mạng khi lưu, tải lại khi đang thi, hết giờ, audio lỗi, tài khoản mới chưa có dữ liệu.
- **Giao diện:** đối chiếu screenshot với Figma ở desktop/mobile; kiểm tra bàn phím, focus trong modal và nhãn form.
- Chạy typecheck, lint, build và các kiểm thử trước bàn giao.

Mặc định giao diện tiếng Việt, nội dung luyện thi tiếng Anh. Dự án chạy local và sẵn sàng đưa lên Vercel; kết nối Supabase thật cần cấu hình tài khoản của bạn. Việc công khai website hoặc phát sinh dịch vụ trả phí không nằm trong mốc bàn giao mặc định.
