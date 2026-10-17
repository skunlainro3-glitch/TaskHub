# Danh mục tour Én Việt

Nguồn do chủ dự án cung cấp: https://dulichenvietcs.netlify.app/. Ghi nhận ngày 17/10/2026. Dữ liệu chuẩn nằm ở `catalog/enviet-tours.json`; cùng một danh mục được phục vụ trên bản local và cloud.

## Nội dung đã nhập

13 tour quốc tế, với mã tour gốc, tên, quốc gia/điểm đến, tuyến đi, thời lượng, hãng bay khi nguồn nêu cụ thể, giá tham khảo, điểm nổi bật, lịch khởi hành dạng mô tả và ảnh từ website nguồn. Mỗi chi tiết tour dẫn về nguồn và ngày ghi nhận. Tour EVG-TQ11 giữ giá `null` và hiển thị “Liên hệ”; không chuyển thành giá 0.

Đây là bản ghi nội dung tại thời điểm nhập, không phải kết nối cập nhật tự động với Én Việt. Ảnh minh họa được tải trực tiếp từ website nguồn. Đã loại 5 ảnh không phù hợp với địa điểm/nội dung tour (EVG-TQ11, EVG-HK14, EVG-LG16, EVG-DL17, EVG-PH21); URL gốc giữ trong `sourceImage` để đối chiếu. Khi thiếu ảnh hoặc không tải được, giao diện hiện “Đang cập nhật ảnh”. Không sao chép hotline, đánh giá khách hàng, lời hứa bảo hiểm hoặc chính sách thương mại của nguồn sang TaskHub.

## Dùng trong điều hành

1. Đăng nhập → Quản lý tour → **Danh mục Én Việt**.
2. Tìm tên, mã hoặc điểm đến → mở chi tiết → **Dùng nội dung tour**.
3. Kiểm tra giá; bổ sung ngày đi chính xác, sức chứa, số khách đã giữ chỗ và lịch trình từng ngày; lưu. Chỉ chọn công khai sau khi xác nhận các thông tin này.

Nội dung có nguồn được điền sẵn vào tên, điểm đến, thời lượng, giá tham khảo và mô tả. Ngày đi, sức chứa, khách đã giữ chỗ và lịch trình từng ngày để trống vì nguồn chưa cung cấp. Checkbox công khai mặc định tắt. Không tạo tour vận hành hoặc công việc tự động, không ghi đè dữ liệu hiện có của bất kỳ tài khoản nào.

## Hiển thị công khai và đồng bộ

Cổng TaskHub chính hiển thị danh mục dưới nhãn “Tham khảo”. Chi tiết không có form đặt chỗ hoặc yêu cầu tư vấn vì chưa có một đợt khởi hành đã xác nhận. Cổng riêng của từng không gian chỉ hiển thị tour do chính không gian đó công khai.

Danh mục là dữ liệu tham chiếu chỉ đọc, tách khỏi bảng tour có lịch/số chỗ. Sau khi người quản lý hoàn thiện và lưu thành tour vận hành, luồng đồng bộ lịch/số chỗ và yêu cầu tư vấn hiện có tiếp tục hoạt động. Các bản ghi tham khảo không được tính thành tester, tương tác khảo sát, phản hồi hoặc tồn chỗ.

## Kiểm tra

`npm test` kiểm tra nguồn, giá chưa xác định, tách biệt không gian, chặn yêu cầu đặt chỗ vào mã tham khảo và từ chối ngày/sức chứa không hợp lệ. `npm run test:ui` kiểm tra tìm kiếm, modal, điện thoại, lấy nội dung và giữ trống các trường thiếu. Chạy cùng bộ kiểm tra với `TEST_DATABASE_DRIVER=libsql` để xác nhận hợp đồng driver dùng cho cloud.
