# Màn hình, nút và điều hướng

Các đường dẫn có `{id}` chỉ chấp nhận UUID tồn tại và thuộc tài khoản đang đăng nhập.

| Màn/đường dẫn | Hành động | Đích/kết quả | Điều kiện và lỗi |
|---|---|---|---|
| `/auth/login` | Đăng nhập | `next` nội bộ hợp lệ hoặc `/dashboard` | Email/mật khẩu hợp lệ; lỗi giữ dữ liệu form; không đi URL ngoài |
| `/auth/login` | Đăng ký / Quên mật khẩu | `/auth/signup` / `/auth/forgot` | Giữ đường dẫn đích cho đăng nhập |
| `/auth/signup` | Tạo tài khoản | `/auth/verify?kind=signup` | Mật khẩu ≥8 ký tự và xác nhận trùng; cần xác nhận email thật |
| `/auth/forgot` | Gửi liên kết | `/auth/verify?kind=recovery` | Thông báo trung tính, không xác nhận tài khoản có tồn tại |
| `/auth/callback` | Mở liên kết email | Trang đích / `/auth/reset` | PKCE code hoặc token hash; lỗi chuyển đăng nhập có thông báo |
| `/auth/reset` | Lưu mật khẩu | `/dashboard` | Cần phiên hợp lệ; mất mạng cho thử lại |
| Thanh điều hướng | Trang chủ / Từ vựng / Thi thử / Lịch sử | Bốn trang tương ứng | Trong bài thi sẽ hỏi trước khi rời trang |
| Thanh tài khoản | Đăng xuất | `/auth/login` | Xóa phiên qua Supabase |
| `/dashboard` | Bắt đầu học | `/vocabulary` | Số liệu từ dữ liệu người dùng |
| `/dashboard` | Bấm cột kết quả | `/result/{id}` | Khi có lượt đã nộp |
| `/vocabulary` | Bắt đầu học theo chủ đề | `/study/{id}` | Tiếp tục phiên chưa hoàn tất cùng tập từ |
| `/vocabulary` | Ôn tập ngay | `/study/{id}` | Vô hiệu hóa khi không có từ đến hạn |
| `/study/{id}` | Lật thẻ | Mặt trước/sau | Không đổi thẻ trong lúc lưu đánh giá |
| `/study/{id}` | Phát/tạm dừng/nghe lại | Điều khiển audio | Lỗi tải cho nút thử lại |
| `/study/{id}` | Chưa thuộc | Đưa từ về cuối hàng đợi | Server lưu tiến độ; lỗi giữ thẻ |
| `/study/{id}` | Mơ hồ / Đã thuộc | Thẻ tiếp theo / quiz | Server đặt lịch 1/3 ngày |
| Quiz trong phiên học | Chọn đáp án / Trước / Tiếp tục | Câu tương ứng | Hiển thị đáp án chọn bằng chữ, màu và trạng thái aria |
| Quiz trong phiên học | Nộp quiz | Tổng kết cùng `/study/{id}` | Server chấm tối đa 5 câu; bỏ trống tính sai; nộp lặp giữ điểm |
| Tổng kết học | Học tiếp / Về trang chủ | `/vocabulary` / `/dashboard` | Kết quả giữ sau tải lại |
| `/exams` | Bắt đầu làm bài | Popup hướng dẫn | 20 câu, 20 phút, audio luyện tập |
| Popup bắt đầu | Hủy / Bắt đầu mini test | Đóng popup / `/attempt/{id}` | Nút khóa khi đang tạo lượt; lỗi hiển thị để thử lại |
| `/exams` | Tiếp tục bài thi | `/attempt/{id}` | Còn lượt chưa nộp và chưa hết giờ |
| `/attempt/{id}` | Chọn đáp án | Lưu server | Đang lưu/đã lưu/chưa lưu; giữ lựa chọn mới nhất |
| `/attempt/{id}` | Lưu lại đáp án | Gửi lại lựa chọn chưa lưu | Không bỏ lỗi của câu khác khi một câu lưu thành công |
| `/attempt/{id}` | Trước / Sau / Chọn số | Câu tương ứng | Mobile mở danh sách trong dialog; số câu có dấu ✓ |
| `/attempt/{id}` | Nộp bài | Popup số câu bỏ trống | Chặn xác nhận khi còn đáp án chưa lưu |
| Popup nộp | Tiếp tục / Xác nhận | Đóng / `/result/{id}` | Server khóa và chấm một lần |
| `/attempt/{id}` | Thoát / Link điều hướng | Popup thoát | Giải thích đồng hồ tiếp tục; chặn rời khi còn đáp án chưa lưu |
| Hết giờ | Tự nộp | `/result/{id}` | Chấm đáp án đã lưu; mất mạng có nút thử nộp lại |
| `/result/{id}` | Xem lời giải | Lời giải trong cùng trang | Đáp án/transcript chỉ trả sau nộp |
| Lời giải | Trước / Sau / Chỉ xem câu sai | Câu tương ứng | Có trạng thái không có câu sai |
| Lời giải | Quay lại kết quả | Tổng kết trong cùng trang | Không tạo thêm lượt thi |
| Kết quả | Làm lại | Popup bắt đầu → lượt mới | Lượt cũ giữ trong lịch sử |
| `/history` | Chọn dòng kết quả | `/result/{id}` | Chỉ hiện lượt đã nộp của chính mình |
| Lịch sử trống | Chọn đề thi | `/exams` | Không có số liệu minh họa thay dữ liệu thật |
| Lỗi tải trang | Thử lại | Tải lại dữ liệu | Có trang 404 tiếng Việt cho ID không thuộc người dùng |

Bảng thao tác Figma thực tế (ID frame/control/đích) được xuất trong `docs/figma-state.json`; một số tương tác Figma vẫn chưa mô phỏng đủ như bản code. Bảng trên là hành vi của ứng dụng đang chạy.
