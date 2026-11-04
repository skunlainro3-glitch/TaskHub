import React from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { departmentNames } from "../shared/access.mjs";
import "./workspace-tools.css";

export function Workflow({ data, access, onNav }) {
  const pending = data.tasks.filter((x) => x.status !== "done").length;
  const steps = [
    {
      title: "Chuẩn bị tour",
      owner: "Điều hành",
      text: "Nhập lịch trình, giá và sức chứa; kiểm tra rồi công khai tour.",
      nav: "tours",
      count: `${data.tours.length} tour`,
      visible: true,
    },
    {
      title: "Tiếp nhận khách",
      owner: "Kinh doanh",
      text: "Khách xem cổng tour và gửi yêu cầu; kinh doanh liên hệ, cập nhật trạng thái.",
      nav: "inbox",
      count: access.canReadInquiries
        ? `${data.inquiries.filter((x) => x.status === "new").length} yêu cầu mới`
        : "Dữ liệu theo quyền kinh doanh",
      visible: access.canReadInquiries,
    },
    {
      title: "Xác nhận chỗ ghép",
      owner: "Điều hành",
      text: "Tạo phiếu đối tác; xác nhận mới giữ chỗ. Phiếu chờ chưa trừ chỗ.",
      nav: "pooling",
      count: access.canReadPooling
        ? `${data.pooling.filter((x) => x.status === "pending").length} phiếu chờ`
        : "Dữ liệu theo quyền B2B",
      visible: access.canReadPooling,
    },
    {
      title: "Đối soát khoản thu",
      owner: "Kế toán",
      text: "Đối chiếu tiền đã nhận thực tế, ghi tổng lũy kế và xem lịch sử thay đổi.",
      nav: "pooling",
      count: access.canReadPooling
        ? `${data.pooling.filter((x) => x.status === "confirmed").length} phiếu xác nhận`
        : "Dữ liệu theo quyền B2B",
      visible: access.canReadPooling,
    },
    {
      title: "Thực hiện công việc",
      owner: "Điều hành / người phụ trách",
      text: "Giao việc theo tour, ghi tên người phụ trách, hạn và trạng thái hoàn thành.",
      nav: "tasks",
      count: `${pending} việc cần theo dõi`,
      visible: true,
    },
  ];
  return (
    <div className="workspace-tools">
      <section className="panel workflow-intro">
        <h2>Quy trình và người phụ trách</h2>
        <p>
          Hiện tại: <strong>{access.label}</strong>. Mỗi bước dùng chung nguồn
          tour/lịch/chỗ; quyền chỉnh sửa phụ thuộc vai trò và quyền được cấp.
        </p>
      </section>
      <ol className="workflow-steps">
        {steps.map((s, i) => (
          <li key={s.title}>
            <span className="workflow-number">{i + 1}</span>
            <small>{s.owner}</small>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            <strong>{s.count}</strong>
            {s.visible && (
              <button className="btn ghost" onClick={() => onNav(s.nav)}>
                Mở mục này <ArrowRight size={15} />
              </button>
            )}
          </li>
        ))}
      </ol>
      <section className="panel tool-panel">
        <h3>Bàn giao giữa các bộ phận</h3>
        <p>
          Yêu cầu tư vấn không phải booking và không tự giữ chỗ. Kinh doanh và
          điều hành cần đối chiếu thông tin, tạo/giao công việc theo tour; kế
          toán kiểm tra phiếu đã xác nhận trước khi ghi nhận thu. Các bước này
          chưa tự gửi thông báo hoặc chuyển tiền.
        </p>
      </section>
      <section className="panel tool-panel">
        <h3>
          <ShieldCheck size={18} /> Ai được xem và thực hiện việc gì?
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vai trò</th>
                <th>Phạm vi chính khi được cấp quyền sửa</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Chủ không gian</td>
                <td>
                  Quản lý toàn bộ dữ liệu của không gian, mời nhân viên và cấp
                  vai trò/quyền.
                </td>
              </tr>
              {Object.entries(departmentNames).map(([id, label]) => (
                <tr key={id}>
                  <td>{label}</td>
                  <td>
                    {
                      {
                        operations:
                          "Quản lý tour, chỗ, công việc, tạo/xác nhận/hủy phiếu ghép; xem sổ thu nhưng không sửa khoản thu.",
                        sales:
                          "Xem tour/chỗ, xử lý yêu cầu tư vấn và công việc; không xem sổ B2B.",
                        accounting:
                          "Xem tour/công việc và sổ B2B, ghi nhận thu; không sửa tour/chỗ hoặc xác nhận phiếu, không xem liên hệ tư vấn.",
                        manager:
                          "Quản lý nghiệp vụ và kế hoạch nội bộ; không tự cấp quyền nhân viên.",
                        general:
                          "Quyền nghiệp vụ tổng hợp tương thích tài khoản cũ; chủ không gian nên phân vai cụ thể.",
                      }[id]
                    }
                  </td>
                </tr>
              ))}
              <tr>
                <td>Người đánh giá</td>
                <td>Chỉ xem/xuất dữ liệu được cấp, không thay đổi dữ liệu.</td>
              </tr>
              <tr>
                <td>Khách hàng</td>
                <td>
                  Xem tour công khai và gửi yêu cầu tư vấn; không vào dữ liệu
                  nội bộ.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted">
          Quyền “Chỉ xem” không cho sửa, kể cả khi vai trò có chức năng nghiệp
          vụ. Hệ thống kiểm tra lại quyền mỗi lần thao tác.
        </p>
      </section>
      <section className="panel tool-panel">
        <h3>Tự động cập nhật định kỳ</h3>
        <ul>
          <li>
            Lịch và số chỗ dùng chung, tự động cập nhật định kỳ. Khi trang đang
            hiển thị và có mạng, hệ thống kiểm tra lại khoảng 5 giây sau lần
            tải trước; thời gian nhận thay đổi phụ thuộc mạng và máy chủ.
          </li>
          <li>
            Mất mạng hoặc quá 15 giây chưa có dữ liệu mới sẽ đánh dấu thông tin
            có thể đã cũ. Giữ bản hiển thị gần nhất để đối chiếu.
          </li>
          <li>
            Khi ghi dữ liệu, máy chủ kiểm tra sức chứa và phiên bản; thay đổi
            đồng thời có thể bị từ chối để nạp lại bản mới.
          </li>
          <li>
            Không tự gửi lại thao tác ghi sau lỗi mạng; cần kiểm tra dữ liệu
            trước khi gửi lại.
          </li>
        </ul>
        <p>
          Theo dõi tình trạng cập nhật ở đầu trang. Chưa có cam kết thời gian
          phản hồi tối đa; khi dữ liệu cũ, tải lại trước khi đối chiếu.
        </p>
      </section>
    </div>
  );
}
