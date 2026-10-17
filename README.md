# TOEIC Master — Web MVP

Ứng dụng học từ vựng và mini test bằng **Next.js App Router, TypeScript, Tailwind và Supabase Auth/PostgreSQL**. Giao diện tiếng Việt, bài luyện tiếng Anh.

## Chạy bản local — không cần Supabase

Đây là cách chạy mặc định theo lựa chọn hoàn tất bản local trước. Yêu cầu Node.js 20.9 trở lên và npm. Trong thư mục dự án:

```powershell
npm ci
npm run local
```

Mở **http://127.0.0.1:3000** và dùng tài khoản mẫu:

`local` biên dịch trước rồi chạy bản đã tối ưu, để trình duyệt không phải chờ biên dịch khi chuyển trang. Chờ thông báo “TOEIC MASTER — BẢN LOCAL” trước khi mở. Mỗi lần khởi động có bước chuẩn bị này; dữ liệu học vẫn được giữ. Khi sửa mã và cần cập nhật tự động, dùng `npm run local:dev`.

- Email: `alice@example.test`
- Mật khẩu: `Test-password-123`

Tài khoản thứ hai để thử dữ liệu độc lập: `bob@example.test`, cùng mật khẩu mẫu. Chỉ dùng tài khoản thử; đăng nhập và email được mô phỏng trong bản local.

Bạn có thể học từ, làm quiz, thi 20 câu, xem kết quả/lời giải và lịch sử. Dữ liệu giữ trong `.local-demo/database` sau khi dừng và chạy lại; đăng nhập lại để tiếp tục. Không cần tạo hoặc chỉnh `.env.local` cho chế độ này.

Đăng ký tài khoản mới hoặc quên mật khẩu sẽ tạo thư tại **http://127.0.0.1:54330/demo/inbox**. Bấm “Hộp thư mô phỏng” trong ứng dụng để mở thư, rồi bấm liên kết xác nhận/khôi phục. Không gửi thư ra Internet. Liên kết dùng một lần; thư và phiên đăng nhập hết hiệu lực khi dừng bản local, còn tài khoản/mật khẩu và tiến độ vẫn được giữ.

Nhấn **Ctrl+C** ở cửa sổ chạy hoặc chạy `npm run local:stop` trong một cửa sổ khác để dừng cả ứng dụng và cơ sở dữ liệu. Dữ liệu học vẫn được giữ. Nếu cổng 3000 hoặc 54330 đang được sử dụng, lệnh sẽ báo rõ và dừng; có thể chọn cổng khác trước khi chạy:

```powershell
$env:TOEIC_LOCAL_APP_PORT="3001"
$env:TOEIC_LOCAL_API_PORT="54332"
npm run local
```

Ứng dụng/adapter chỉ lắng nghe trên `127.0.0.1`. Chế độ local có dòng nhãn riêng trên giao diện, lưu dữ liệu ngoài mã nguồn và dùng thư mục build riêng `.next-local-build`. Nhãn/email mô phỏng chỉ được bật khi lệnh local đặt cờ riêng, địa chỉ backend loopback và khóa thử `local-demo-only`. Lệnh build thông thường không bật chế độ này. Cấu hình Supabase thật không bị ghi đè.

Nếu một tab Edge cũ đứng yên sau khi ứng dụng được cập nhật, mở đúng địa chỉ trên, nhấn **Ctrl+Shift+R** rồi đăng nhập lại nếu được yêu cầu. Không cần xóa dữ liệu trình duyệt. Hai địa chỉ `localhost` và `127.0.0.1` lưu phiên đăng nhập riêng; nên dùng nhất quán địa chỉ `127.0.0.1` mà lệnh local in ra.

## Tùy chọn làm sau — kết nối Supabase thật

Yêu cầu Node.js 20.9 trở lên và npm. Chạy các lệnh trong thư mục dự án:

```powershell
npm ci
Copy-Item .env.example .env.local
```

Điền `.env.local` bằng thông tin dự án Supabase của bạn:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SITE_URL` phải khớp chính xác địa chỉ bạn mở, gồm cả giao thức và cổng. Đừng trộn `localhost` và `127.0.0.1` trong cùng luồng đăng nhập/khôi phục. Không đưa khóa `service_role` vào biến public hay trình duyệt; ứng dụng không cần khóa này.

Trong Supabase SQL Editor, chạy lần lượt:

1. `supabase/migrations/001_mvp.sql` — chỉ áp dụng một lần cho dự án mới.
2. `supabase/migrations/002_study_integrity.sql` — nâng cấp và bảo vệ phiên học; dùng được cho bản MVP đã cài migration đầu.
3. `supabase/seed.sql` — có thể chạy lại, cập nhật dữ liệu mẫu theo ID, giữ dữ liệu tiến độ/lượt thi.

Trong Supabase Authentication, bật Email/Password, bật xác nhận email, đặt Site URL là `http://localhost:3000` và thêm `http://localhost:3000/auth/callback` vào Redirect URLs. Khi dùng domain khác, cập nhật đồng thời biến môi trường và cấu hình URL của Supabase. Khởi động lại ứng dụng sau khi đổi `.env.local`.

```powershell
npm run dev
```

Mở `http://localhost:3000`, đăng ký, xác nhận email rồi đăng nhập. Khi chưa cấu hình Supabase, ứng dụng hiển thị hướng dẫn kết nối và vô hiệu hóa form tài khoản.

## Luồng có thể sử dụng

- Tài khoản: đăng ký, xác nhận email, đăng nhập, đăng xuất, quên/đặt lại mật khẩu; quay về trang được yêu cầu sau đăng nhập.
- Từ vựng: chọn một trong ba chủ đề, lật thẻ/nghe audio, tự đánh giá, quiz tối đa năm câu và tổng kết. Bấm học lại cùng chủ đề sẽ tiếp tục phiên chưa hoàn tất.
- Lịch ôn: chưa thuộc xuất hiện lại trong phiên; mơ hồ sau một ngày; đã thuộc sau ba ngày. Đồng hồ tính theo thời gian đã trôi, không phải ngày trên lịch.
- Thi: 20 câu, gồm 10 Listening và 10 Reading, 20 phút, nghe lại audio được phép. Lựa chọn được lưu tuần tự; lỗi mạng giữ lựa chọn chưa lưu và cung cấp nút thử lại.
- Tải lại/thoát bài giữ cùng lượt thi và hạn giờ. Nộp bài khi còn đáp án chưa lưu bị chặn. Hết giờ chấm những đáp án server đã nhận.
- Kết quả: số câu đúng, phần trăm, phân tích nghe/đọc, lời giải, transcript, lọc câu sai, làm lại và lịch sử. Không quy đổi sang thang TOEIC 990.

Các trang chính: `/dashboard`, `/vocabulary`, `/study/{id}`, `/exams`, `/attempt/{id}`, `/result/{id}`, `/history`. Bảng màn hình/nút/đường dẫn nằm trong `docs/navigation.md`.

## Kiểm thử

```powershell
npm run check
npx playwright install chromium
npm run test:e2e
npm run test:local
```

`check` chạy typecheck, lint, 21 kiểm thử logic/SQL/local API và build. `test:e2e` chạy sáu tình huống trình duyệt; `test:local` chạy hai tình huống trên bản local đã tối ưu: điều hướng Từ vựng/lưu tiến độ sau tải lại, và tài khoản mới/hộp thư mô phỏng/khôi phục. Các lệnh riêng: `test:unit`, `test:db`, `typecheck`, `lint`, `build`.

Để kiểm tra bằng Edge đã cài trên máy:

```powershell
$env:PLAYWRIGHT_BROWSER_CHANNEL="msedge"
npm run test:local
```

Integration SQL dùng **PGlite chạy PostgreSQL thực** trong bộ nhớ, áp dụng migration/seed thật và đặt role/user để kiểm tra RLS, chấm điểm, hết giờ và thao tác lặp. Không cần Docker hoặc Supabase thật để chạy bộ này.

E2E mở Next.js trên `127.0.0.1:3100` và adapter thử trên `127.0.0.1:54329`. Adapter ở `tests/fixtures/` được dùng cho E2E và chế độ chạy local, mô phỏng Auth/email/HTTP; truy vấn, RPC, migration và RLS chạy trên PostgreSQL. Hai cổng phải đang trống. `test:local` dùng cổng 3200/54331 và thư mục dữ liệu thử riêng trong `work/`, không dùng `.local-demo` của bạn. Các tài khoản `example.test` chỉ tồn tại trong bộ nhớ của tiến trình thử, không thuộc Supabase thật. Chạy test không ghi dữ liệu vào dự án Supabase của bạn. Adapter không được ứng dụng production import. Kiểm thử lưu trữ tự khởi động lại adapter và xác minh tài khoản, mật khẩu mới và điểm đã nộp vẫn còn.

Nếu đã có Chromium, có thể đặt `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` tới file thực thi trước khi chạy. JSON kết quả, ảnh và trace lỗi nằm trong `test-results/` và `test-results-local/` (đã được bỏ qua bởi Git).

Kết quả nghiệm thu local và phần còn thiếu: `docs/verification.md`. **Email thật, PKCE qua email thật, cấu hình Supabase đám mây và đăng nhập lại sau khởi động lại cần kiểm tra trên tài khoản của bạn.**

## Dữ liệu mẫu và audio

Seed có ba chủ đề, 30 từ, một đề 20 câu, 40 tệp WAV trong `public/audio/`. Text luyện tập là nội dung mẫu riêng của dự án, không phải đề thi TOEIC chính thức.

```powershell
npm run seed
powershell -ExecutionPolicy Bypass -File scripts/generate-audio.ps1
```

Lệnh thứ hai chỉ cần khi muốn tạo lại audio trên Windows có giọng đọc tiếng Anh; các tệp hiện có đã được chuẩn bị. Script dùng `System.Speech`. Hồ sơ quyền phân phối của giọng đã dùng chưa được ghi trong dự án; cần xác nhận trước khi công khai/phân phối audio. Không mặc định coi giọng hệ thống là tài nguyên có giấy phép thương mại.

## Thiết kế và phần còn lại

Bản sao đang làm: [TOEIC Learning App — UI Design (Copy)](https://www.figma.com/design/E7V0PoF8bH5g8mpdV4TydV). `Reference` giữ các màn nguồn; `Foundations` chứa token/component; `Prototype` chứa nhóm `Web MVP` và `Mobile MVP` cùng hai điểm bắt đầu. Tài khoản Figma hiện giới hạn ba trang nên hai nhóm được tổ chức bằng Section. Chưa xác minh được URL file nguồn trước khi duplicate, chưa đổi tên file thành tên nghiệm thu trong PLAN.

Giao diện local đã kiểm tra các kích thước 360, 390, 768, 1024 và 1440px. Figma vẫn cần kiểm tra toàn bộ frame/state, nối tương tác chọn đáp án và đối chiếu từng màn với bản code; chưa đạt tiêu chí khớp pixel toàn bộ thiết kế.

Chưa triển khai công khai. Khi chuẩn bị Vercel, dùng Node phù hợp, cấu hình ba biến môi trường, cập nhật Site URL/Redirect URLs và chạy nghiệm thu Supabase thật trước. Không tự tạo dịch vụ trả phí.
