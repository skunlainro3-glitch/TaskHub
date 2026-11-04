# Danh mục tour Én Việt

Nguồn do chủ dự án cung cấp: https://dulichenvietcs.netlify.app/. Ghi nhận ngày 17/10/2026. Dữ liệu chuẩn nằm ở `catalog/enviet-tours.json`; danh mục chỉ dùng **nội bộ điều hành** từ bản sửa 0.7.3, không hiển thị/tìm lọc trên cổng khách hàng.

## Nội dung đã nhập

13 tour quốc tế, với mã tour gốc, tên, quốc gia/điểm đến, tuyến đi, thời lượng, hãng bay khi nguồn nêu cụ thể, giá tham khảo, điểm nổi bật, lịch khởi hành dạng mô tả và ảnh từ website nguồn. Mỗi chi tiết tour dẫn về nguồn và ngày ghi nhận. Tour EVG-TQ11 giữ giá `null` và hiển thị “Liên hệ”; không chuyển thành giá 0.

Đây là bản ghi nội dung tại thời điểm nhập, không phải kết nối cập nhật tự động với Én Việt. Những nguồn ảnh đã lỗi được chặn tải lại; ảnh thiếu dùng minh họa/fallback có nhãn. URL nguồn được giữ để đối chiếu, không coi ảnh minh họa là ảnh đoàn khách TaskHub. Không sao chép hotline, đánh giá khách hàng, lời hứa bảo hiểm hoặc chính sách thương mại của nguồn sang TaskHub.

## Dùng trong điều hành

1. Đăng nhập → Quản lý tour → **Danh mục Én Việt**.
2. Tìm tên, mã hoặc điểm đến → **Dùng tour** ngay trên dòng kết quả. Từ màn hình quản lý, mở danh mục rồi dùng nội dung là hai lần chạm; mở chi tiết để đọc thêm khi cần.
3. Kiểm tra giá; bổ sung ngày đi chính xác, sức chứa, số khách đã giữ chỗ và lịch trình từng ngày; lưu. Chỉ chọn công khai sau khi xác nhận các thông tin này.

Nội dung có nguồn được điền sẵn vào tên, điểm đến, thời lượng, giá tham khảo và mô tả. Ngày đi, sức chứa, khách đã giữ chỗ và lịch trình từng ngày để trống vì nguồn chưa cung cấp. Checkbox công khai mặc định tắt. Không tạo tour vận hành hoặc công việc tự động, không ghi đè dữ liệu hiện có của bất kỳ tài khoản nào.

## Công khai tour vận hành và đồng bộ

Cổng chính và cổng riêng của từng không gian chỉ hiển thị tour do điều hành công khai. Danh mục tham khảo không có khối giới thiệu, số đếm, lựa chọn điểm đến hoặc kết quả riêng trên portal. Muốn dùng nội dung tham khảo thì người có quyền mở **Quản lý tour → Danh mục Én Việt**, bổ sung dữ liệu và lưu tour nháp trước.

Danh mục là dữ liệu tham chiếu chỉ đọc, tách khỏi bảng tour có lịch/số chỗ. Sau khi người quản lý hoàn thiện và lưu thành tour vận hành, luồng đồng bộ lịch/số chỗ và yêu cầu tư vấn hiện có tiếp tục hoạt động. Các bản ghi tham khảo không được tính thành tester, tương tác khảo sát, phản hồi hoặc tồn chỗ.

## Kiểm tra

`npm test` kiểm tra nguồn, giá chưa xác định, tách biệt không gian, chặn yêu cầu đặt chỗ vào mã tham khảo và từ chối ngày/sức chứa không hợp lệ. `npm run test:ui` kiểm tra tìm kiếm, modal, điện thoại, lấy nội dung và giữ trống các trường thiếu. Chạy cùng bộ kiểm tra với `TEST_DATABASE_DRIVER=libsql` để xác nhận hợp đồng driver dùng cho cloud.
