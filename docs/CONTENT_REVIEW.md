# Rà soát nội dung và phạm vi — 15/10/2026

Theo yêu cầu chủ dự án: không tự đưa thông tin kinh doanh chưa được cung cấp lên web. Trang đầu mô tả chức năng thực tế của TaskHub; không đóng vai một công ty bán tour có sẵn hàng.

| Nội dung | Căn cứ và xử lý |
| --- | --- |
| TaskHub; doanh nghiệp lữ hành Việt Nam 10–50 nhân sự; điều hành và Sales | Báo cáo CP2, mục 2.1 và 6.2. Giữ định vị này. |
| Quản lý tour, lịch/số chỗ dùng chung, công việc theo tour, cổng khách hàng | Phạm vi bản đầu trong CP2 và các luồng FE/BE đã chạy. Mô tả đúng chức năng; cập nhật bằng polling mỗi 5 giây, không quảng cáo SLA. |
| Tour, giá, lịch, số khách, lịch trình, tên người phụ trách | Ngày 17/10 chủ dự án cung cấp nguồn Én Việt: nhập 13 nội dung tour vào danh mục tham khảo có dẫn nguồn. Không tự tạo ngày đi, sức chứa, khách đã giữ chỗ hoặc lịch trình từng ngày; không seed tour vận hành/công việc. Form mới vẫn trống; chọn từ danh mục chỉ điền nội dung có nguồn và mặc định chưa công khai. Không gắn thành viên nhóm vào vai trò nhân sự giả. |
| Yêu cầu tư vấn | Ghi vào điều hành; không giữ chỗ, xác nhận đặt tour, thanh toán hoặc tự gửi email. |
| Thống kê, khách hàng, lời chứng thực, giá SaaS | Không tạo số liệu người dùng, đối tác, lời chứng thực hoặc bảng giá đã chốt. Mức 500.000 VND/tháng trong CP2 là giả định, không đưa lên như giá bán. |
| Dùng thử và quyền riêng tư | Đăng ký tự nguyện, không quà tặng; email tự nhập chưa được xác minh. Vai trò và quy mô phải do người dùng chọn, không điền sẵn. Có giới hạn lưu 180 ngày, xóa tài khoản, phân quyền nghiên cứu và reviewer chỉ xem. |
| Nội dung AI | Gỡ báo cáo riêng và phần README tương ứng theo yêu cầu. Không có báo cáo AI trong giao diện sản phẩm. Tiêu chí disclosure của bài nộp vẫn được ghi đúng trong bảng đối chiếu CP3. |

Chưa có bằng chứng hoàn tất khảo sát CP3 với 20 cá nhân. Nhóm còn phải tuyển người thật, phân tích phản hồi, chốt giá và quyết định Iterate/Persevere, hoàn thiện BMC/slide và thủ tục nộp/thuyết trình. Việc cải thiện web không thay cho các đầu việc này.

Dữ liệu giả để kiểm thử chỉ nằm trong `tests/fixtures.mjs` và các tài khoản QA tạm thời; không được seed vào ứng dụng hoặc tính vào kết quả khảo sát. Xóa tour yêu cầu xác nhận và kiểm tra phiên bản/quyền sở hữu; reviewer không được xóa.
