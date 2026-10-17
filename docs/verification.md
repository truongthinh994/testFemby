# Kết quả tiếp tục dự án — 17/10/2026

## Trạng thái

Mã nguồn được sửa trực tiếp trong `C:\Users\LENOVO\Downloads\testfemby`. Ứng dụng đã build thành công; các luồng local được kiểm thử với dữ liệu riêng. **Chưa nghiệm thu Supabase thật và chưa hoàn tất toàn bộ Figma.** Không tạo dự án đám mây, không triển khai công khai và không phát sinh dịch vụ trả phí.

## Mốc local theo lựa chọn của người dùng

- Chạy bằng `npm run local`, mặc định tại `http://127.0.0.1:3000`; không cần cấu hình Supabase.
- Tài khoản mẫu `alice@example.test` và `bob@example.test`, mật khẩu mẫu `Test-password-123`.
- Tài khoản, mật khẩu được băm, lịch ôn, phiên học và điểm thi lưu trong `.local-demo/database`; mở lại thì đăng nhập lại, dữ liệu vẫn còn.
- Đăng ký cần bấm liên kết trong hộp thư mô phỏng `http://127.0.0.1:54330/demo/inbox`. Khôi phục mật khẩu dùng cùng hộp thư. Không gửi email thật.
- Tất cả dịch vụ local chỉ mở trên loopback. Nút điều khiển lỗi/thời hạn dành cho test bị tắt trong demo. Thông báo bản local/tài khoản mẫu chỉ hiện khi có cờ local, địa chỉ backend loopback và khóa thử riêng; có cả trong bản local đã tối ưu.
- Lệnh dừng đóng cơ sở dữ liệu trước rồi dừng cây tiến trình ứng dụng; cấu hình/build local tách khỏi bản production.
- Kiểm thử riêng đã xác nhận đăng ký/xác nhận một lần, đổi mật khẩu, nộp bài, tắt/mở adapter, đăng nhập bằng mật khẩu mới và đọc lại điểm cũ.
- Kiểm tra chạy thực tế: khởi động toàn bộ ứng dụng ở cổng 3000/54330, nộp một lượt thử của tài khoản mẫu Bob, chạy `npm run local:stop`, mở lại và đọc được đúng điểm cũ. Bản local được để sẵn cho người dùng tại `http://127.0.0.1:3000`.

## Đã sửa

- Sau phản ánh Edge bấm Từ vựng đứng yên: chuyển `npm run local` từ `next dev` sang `next build` + `next start`, tách thư mục `.next-local-build`; `local:dev` dành cho sửa mã. Không xóa dữ liệu học.
- Bỏ làm mới root layout sau mỗi đánh giá từ; chỉ làm mới các trang tổng hợp liên quan. Bộ kiểm thử xác nhận tiến độ trên Trang chủ vẫn cập nhật, tải lại tiếp tục đúng thẻ.
- Sửa lỗi cú pháp ở lớp kết nối Supabase khiến TypeScript và build không chạy.
- Tách tải dữ liệu server, điều khiển audio/modal và giao diện thi khỏi component chính; xử lý đường dẫn thiếu/sai ID và trang 404 tiếng Việt.
- Chuyển thời điểm ban đầu từ server sang giao diện để tránh lỗi render và đồng hồ khác nhau giữa máy người học/server.
- Lưu đáp án tuần tự, giữ lựa chọn mới nhất khi bấm nhanh, giữ đáp án chưa lưu sau lỗi mạng và không xóa trạng thái lỗi của câu khác. Nút nộp/rời bài chờ lưu xong; hết giờ chấm đáp án server đã nhận.
- Hỏi trước khi dùng menu rời bài thi, cảnh báo khi đóng/tải lại trang còn lựa chọn chưa lưu; đánh dấu câu đã trả lời bằng chữ/icon và màu.
- Không xóa dữ liệu form đăng nhập/đăng ký khi server trả lỗi. Xử lý lỗi mạng tài khoản và xác thực URL đích nội bộ, gồm cả ký tự điều khiển.
- Callback khôi phục dùng địa chỉ ứng dụng đã cấu hình, tránh đổi `127.0.0.1` thành `localhost` làm mất cookie phiên.
- Thẻ không cho thao tác lúc lưu đánh giá; audio có nút thử lại và đặt lại trạng thái khi đổi nguồn.
- Migration `002_study_integrity.sql`: tiếp tục phiên học chưa xong; từ chưa thuộc phải ôn lại trước quiz; từ chối đánh giá null/không hợp lệ; chấm quiz một lần; thêm chỉ mục tiến độ/lịch sử.
- Bổ sung README, bảng điều hướng, bộ kiểm thử SQL/trình duyệt và kết quả Figma thực tế vào tài liệu dự án.

## Kiểm thử local

| Nhóm | Phạm vi | Kết quả |
|---|---|---|
| TypeScript | Mã nguồn và mã kiểm thử | Đạt |
| ESLint | Quy tắc React/Next/TypeScript | Đạt, không còn cảnh báo |
| Unit và PostgreSQL | 21 test theo tổng kết runner | Đạt |
| Build production | Next.js 16.4.2, Turbopack | Đạt |
| E2E Chromium | 6 tình huống chính | Đạt (1,2 phút) |
| Bản local tối ưu trên Microsoft Edge | Menu Từ vựng/flashcard/lưu tiến độ sau tải lại + đăng ký/xác nhận/khôi phục | 2/2 đạt (32,1 giây, gồm khởi động) |

**Đo riêng trên Edge, hồ sơ thử sạch:** trước tối ưu, các tài nguyên Next tải ở trang đăng nhập có tổng dung lượng giải nén 3.649.181 byte; sau tối ưu còn 483.873 byte. Lượt đo ở `127.0.0.1` mở menu Từ vựng 227 → 114 ms, bắt đầu phiên học 849 → 212 ms, lưu đánh giá 266 → 76 ms. Đây là số đo một lượt trên máy hiện tại, không phải cam kết tốc độ ở mọi máy. Log phát triển cũ ghi nhận mở trang lạnh mất tới 2,8 giây vì biên dịch tại chỗ.

**Lỗi Edge được phản ánh:** người dùng bấm menu Từ vựng nhưng màn hình đứng yên. Chưa tái hiện được trong hồ sơ Edge thử riêng; cả `127.0.0.1` và `localhost` đều mở được, không có lỗi JavaScript hay HTTP trong lượt đo. Chưa xác định được URL/profile/cache của tab Edge ban đầu, nên chưa kết luận nguyên nhân cụ thể của lỗi đứng yên. Hướng dẫn mở `http://127.0.0.1:3000/vocabulary`, Ctrl+Shift+R và đăng nhập lại sau khi thay bản chạy. Dữ liệu học trên đĩa được giữ.

`npm audit --omit=dev` không báo lỗ hổng ở phụ thuộc production tại lần kiểm tra này. Audit đầy đủ vẫn báo năm mục mức cao trong chuỗi công cụ lint (`braces` → `micromatch` → `fast-glob` → ESLint Next); chưa có bản vá tương thích được audit đề xuất. Không chạy sửa tự động buộc hạ phiên bản Next/ESLint.

**SQL thực trong PGlite:** áp dụng cả hai migration; chạy seed hai lần; đủ 30 từ và 20 câu; bắt đầu lặp tiếp tục cùng lượt; không đọc được đáp án trước nộp; tài khoản B không đọc/sửa/nộp lượt của A; không cập nhật điểm trực tiếp; lựa chọn sai định dạng bị từ chối; câu bỏ trống tính sai; nộp lặp giữ kết quả; hết giờ chặn thay đáp án và giới hạn thời gian nộp; lịch ôn 0/1/3 ngày; quiz không vượt qua từ chưa thuộc; tài khoản ẩn danh bị từ chối.

**Trình duyệt:** đăng nhập sai rồi đúng và quay lại đích; đăng ký/xác nhận mật khẩu không khớp; khôi phục mật khẩu và callback lỗi; flashcard lặp từ chưa thuộc, tải lại và quiz/tổng kết; thi, lưu nhanh, tải lại cùng lựa chọn, lỗi lưu/thử lại, popup câu bỏ trống, kết quả/lời giải/lọc câu sai/lịch sử; tự nộp sau ba giây trên lượt thử; người dùng khác không xem kết quả; điều hướng ngoài bị chặn; audio lỗi/thử lại; focus và Escape trong dialog.

**Responsive:** kiểm tra không tràn ngang ở 360, 390, 768, 1024 và 1440px cho đăng nhập, đăng ký, quên/đặt lại mật khẩu, dashboard, chủ đề, flashcard, quiz, tổng kết học, danh sách đề, bài thi, kết quả, lời giải và lịch sử. Kiểm tra tên dài trên dashboard. Luồng local kiểm tra thêm nhãn demo, tài khoản mẫu, đăng ký qua hộp thư, đặt lại mật khẩu và đăng nhập bằng mật khẩu mới. Ảnh kiểm tra nằm trong `test-results/screenshots/` và `test-results-local/screenshots/`.

**Giới hạn của bằng chứng:** PostgreSQL/RLS và server actions chạy thật; adapter HTTP ở `tests/fixtures/` mô phỏng Supabase Auth và email. Chưa kiểm tra được email thực, PKCE qua email thực, SMTP/rate limit, cấu hình dự án Supabase đám mây, nhiều tab/máy cùng lúc hoặc cạnh tranh giao dịch PostgreSQL nhiều kết nối. PGlite chạy trong một tiến trình, nên không thay thế bài kiểm tra concurrency trên Supabase thật.

## Figma

[Bản sao đang làm](https://www.figma.com/design/E7V0PoF8bH5g8mpdV4TydV). Trình duyệt hiển thị tên `TOEIC Learning App - UI Design (Copy)`.

- Giữ trang `Reference`; trang `Foundations` có sáu bộ component và tám token màu.
- Trang `MVP` đổi thành `Prototype`; nhóm `Web MVP` có 28 frame, `Mobile MVP` có 27 frame.
- Gói hiện tại từ chối tạo trang thứ tư. Hai nhóm dùng Section trong `Prototype`, giữ tổng ba trang; chưa đạt cách tổ chức năm trang nguyên văn trong kế hoạch.
- Sửa nhãn lịch ôn, bỏ mô tả SuperMemo-2 không đúng với MVP; sửa các cột điểm từ thang hàng trăm sang phần trăm; bảng câu hỏi desktop còn đúng 20 câu.
- Mặt trước flashcard vô hiệu hóa nút tự đánh giá; mặt sau cho từ chưa thuộc quay lại và hai mức còn lại đi quiz. Quiz mobile dùng frame riêng và liên kết cùng viewport.
- Xuất 148 liên kết điều hướng NODE hiện có vào `docs/figma-state.json`; kiểm tra không có liên kết mobile sang desktop. Giữ hai điểm bắt đầu prototype desktop/mobile. Popup đã có mở/hủy/xác nhận từ bản đang làm.
- Đã xem ảnh desktop bài thi, mobile flashcard và mobile bài thi sau sửa; chưa có kiểm tra trực quan toàn bộ 55 frame hoặc nghiệm thu chọn đáp án tương tác trên Figma. Giao diện code giữ phong cách/tokens hiện có, chưa khẳng định khớp pixel mọi màn.

## Phần để sau mốc local — nghiệm thu toàn bộ PLAN

1. Điền `.env.local` bằng URL và publishable key Supabase của dự án bạn muốn dùng, áp dụng migration/seed, cấu hình URL email theo README.
2. Thử đăng ký/xác nhận email, PKCE, khôi phục mật khẩu thật, hai tài khoản thật, đăng nhập lại sau khi khởi động lại ứng dụng, và thao tác cạnh tranh trên Supabase thật.
3. Bổ sung URL file Figma nguồn, đổi tên bản sao theo PLAN, hoàn thiện tương tác chọn đáp án/audio/lỗi và kiểm tra từng frame ở các chiều rộng yêu cầu. Giữ Section thay trang khi tiếp tục dùng gói ba trang.
4. Xác nhận quyền phân phối giọng đọc của các WAV hiện có trước khi công khai; dự án chưa ghi hồ sơ giấy phép giọng.

Không đánh dấu toàn bộ kế hoạch hoàn thành khi các phần trên chưa có bằng chứng.
