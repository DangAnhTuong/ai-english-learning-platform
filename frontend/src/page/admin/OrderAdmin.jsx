import React, { useState, useMemo, useEffect } from 'react';
import {
  Card, Table, Tag, Space, Button, Input, DatePicker, Select,
  Tabs, Statistic, Row, Col, message, Typography, Progress, Popconfirm, Tooltip
} from 'antd';
import {
  SearchOutlined, FileExcelOutlined, FilePdfOutlined,
  DollarOutlined, ShoppingCartOutlined, RiseOutlined, ReloadOutlined,
  CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { adminService } from '../../services/adminService';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const OrderAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // --- 1. LOAD DỮ LIỆU TỪ API ---
  const loadOrders = async (filters = {}) => {
    setLoading(true);
    try {
      const response = await adminService.getOrders(filters, {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      if (response.success && response.data) {
        // Map API data to component format
        const mappedOrders = response.data.map(order => ({
          key: order.orderNumber || order._id,
          _id: order._id,
          orderNumber: order.orderNumber,
          userCode: order.userId?.email || order.userId?.username || 'N/A',
          userName: order.userId?.name || 'N/A',
          package: order.package?.name || 'N/A',
          price: order.finalAmount || order.amount || 0,
          date: dayjs(order.createdAt).format('YYYY-MM-DD'),
          status: order.status || 'pending',
          paymentStatus: order.paymentStatus,
          transactionId: order.transactionId
        }));

        setOrders(mappedOrders);
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.pagination.total || 0
          }));
        }
      }
    } catch (error) {
      console.error('Load orders error:', error);
      message.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [pagination.page]);

  // --- 2. HÀM XỬ LÝ DUYỆT / HỦY ĐƠN ---
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      if (newStatus === 'paid') {
        // Verify payment
        await adminService.verifyPayment(orderId);
        message.success('Đã duyệt đơn hàng thành công!');
      } else {
        // Update status
        await adminService.updateOrderStatus(orderId, newStatus);
        message.success(newStatus === 'failed' ? 'Đã hủy đơn hàng!' : 'Đã cập nhật trạng thái!');
      }

      // Reload orders
      loadOrders();
    } catch (error) {
      console.error('Update order status error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Không thể cập nhật trạng thái đơn hàng';
      message.error(errorMessage);
    }
  };

  // --- 3. HÀM XUẤT EXCEL (CSV) ---
  const handleExportCSV = () => {
    // Header của file Excel
    const headers = ["Mã đơn,Người học,Email/Mã,Gói học,Giá,Ngày,Trạng thái"];

    // Dữ liệu từng dòng
    const dataRows = filteredOrders.map(item =>
      `${item.key},"${item.userName}","${item.userCode}","${item.package}",${item.price},${item.date},${item.status}`
    );

    // Ghép lại thành chuỗi
    const csvContent = [headers, ...dataRows].join("\n");

    // Tạo Blob (Thêm \uFEFF để Excel nhận diện Tiếng Việt UTF-8)
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Tải xuống
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Bao_cao_Doanh_thu_${dayjs().format('DD-MM-YYYY')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Đã xuất file Excel thành công!');
  };

  // --- 4. HÀM XUẤT PDF ---
  const handleExportPDF = () => {
    const input = document.getElementById('report-section');
    message.loading('Đang tạo PDF...', 1);
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Bao_cao_${reportType}.pdf`);
      message.success('Xuất PDF thành công!');
    });
  };

  // --- STATE BỘ LỌC ---
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState(undefined);
  const [filterPackage, setFilterPackage] = useState(undefined);
  const [dateRange, setDateRange] = useState(null);
  const [reportType, setReportType] = useState('year');
  const [reportDate, setReportDate] = useState(dayjs());

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  // --- FILTER LOGIC ---
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchSearch = searchText === '' ||
        order.key?.toLowerCase().includes(searchText.toLowerCase()) ||
        order.orderNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
        order.userName?.toLowerCase().includes(searchText.toLowerCase());
      const matchStatus = filterStatus ? order.status === filterStatus : true;
      let matchPackage = true;
      if (filterPackage === '1m') matchPackage = order.package?.includes('1 Tháng');
      if (filterPackage === '3m') matchPackage = order.package?.includes('3 Tháng');
      if (filterPackage === 'lifetime') matchPackage = order.package?.includes('Trọn đời');
      let matchDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const orderDate = dayjs(order.date);
        matchDate = (orderDate.isSame(dateRange[0], 'day') || orderDate.isAfter(dateRange[0], 'day')) &&
          (orderDate.isSame(dateRange[1], 'day') || orderDate.isBefore(dateRange[1], 'day'));
      }
      return matchSearch && matchStatus && matchPackage && matchDate;
    });
  }, [orders, searchText, filterStatus, filterPackage, dateRange]);

  // Reload orders when filters change
  useEffect(() => {
    const filters = {};
    if (filterStatus) filters.status = filterStatus;
    if (dateRange && dateRange[0] && dateRange[1]) {
      filters.dateFrom = dateRange[0].format('YYYY-MM-DD');
      filters.dateTo = dateRange[1].format('YYYY-MM-DD');
    }
    if (searchText) filters.search = searchText;

    // Debounce search
    const timeoutId = setTimeout(() => {
      loadOrders(filters);
    }, searchText ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [filterStatus, dateRange, searchText]);

  // --- REPORT LOGIC ---
  const reportData = useMemo(() => {
    const filteredByTime = orders.filter(o => {
      const orderDate = dayjs(o.date);
      if (reportType === 'date') return orderDate.isSame(reportDate, 'day');
      else if (reportType === 'month') return orderDate.isSame(reportDate, 'month');
      else return orderDate.isSame(reportDate, 'year');
    });

    const revenueOrders = filteredByTime.filter(o => o.status === 'paid');
    const totalRev = revenueOrders.reduce((acc, curr) => acc + Number(curr.price), 0); // Ép kiểu Number cho chắc
    const count = filteredByTime.length;
    const rate = count > 0 ? Math.round((revenueOrders.length / count) * 100) : 0;

    const levels = { '1 Tháng': 0, '3 Tháng': 0, 'Trọn đời': 0 };
    revenueOrders.forEach(o => {
      const packageName = o.package || '';
      if (packageName.includes('1 Tháng')) levels['1 Tháng'] += Number(o.price);
      else if (packageName.includes('3 Tháng') || packageName.includes('3 tháng')) levels['3 Tháng'] += Number(o.price);
      else if (packageName.includes('Trọn đời')) levels['Trọn đời'] += Number(o.price);
    });

    let label = "";
    if (reportType === 'date') label = `Ngày ${reportDate.format('DD/MM/YYYY')}`;
    else if (reportType === 'month') label = `Tháng ${reportDate.format('MM/YYYY')}`;
    else label = `Năm ${reportDate.format('YYYY')}`;

    return { totalRev, count, rate, levels, label };
  }, [orders, reportType, reportDate]);

  // --- CỘT BẢNG ---
  const columns = [
    { title: 'Mã đơn', dataIndex: 'key', render: t => <b style={{ color: '#1890ff' }}>{t}</b> },
    { title: 'Người học', dataIndex: 'userName', render: (t, r) => <div>{t}<br /><small style={{ color: '#999' }}>{r.userCode}</small></div> },
    { title: 'Gói học', dataIndex: 'package', render: (t, r) => <div><Tag color="cyan">{t}</Tag></div> },
    { title: 'Giá trị', dataIndex: 'price', align: 'right', render: t => <b style={{ color: '#d4380d' }}>{formatCurrency(t)}</b> },
    { title: 'Ngày tạo', dataIndex: 'date' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      render: s => <Tag color={s === 'paid' ? 'success' : (s === 'pending' ? 'warning' : 'error')}>{s === 'paid' ? 'Đã TT' : (s === 'pending' ? 'Chờ xử lý' : 'Thất bại')}</Tag>
    },
    {
      title: 'Hành động',
      align: 'center',
      render: (_, record) => (
        record.status === 'pending' ? (
          <Space>
            <Tooltip title="Xác nhận đã nhận tiền">
              <Popconfirm title="Duyệt đơn này?" onConfirm={() => handleUpdateStatus(record._id, 'paid')}>
                <Button type="primary" size="small" icon={<CheckCircleOutlined />} />
              </Popconfirm>
            </Tooltip>
            <Tooltip title="Hủy đơn hàng">
              <Popconfirm title="Hủy đơn này?" okType="danger" onConfirm={() => handleUpdateStatus(record._id, 'failed')}>
                <Button danger size="small" icon={<CloseCircleOutlined />} />
              </Popconfirm>
            </Tooltip>
          </Space>
        ) : <Text type="secondary" style={{ fontSize: 12 }}>Đã hoàn tất</Text>
      )
    }
  ];

  return (
    <Card title="Quản trị Đơn hàng & Doanh thu" bordered={false}>
      <Tabs type="card" items={[
        {
          key: '1', label: <span><ShoppingCartOutlined /> Quản lý Đơn hàng</span>,
          children: (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}><Input prefix={<SearchOutlined />} placeholder="Tìm mã, tên..." value={searchText} onChange={e => setSearchText(e.target.value)} /></Col>
                <Col span={6}><RangePicker style={{ width: '100%' }} value={dateRange} onChange={setDateRange} /></Col>
                <Col span={4}><Select placeholder="Trạng thái" style={{ width: '100%' }} allowClear value={filterStatus} onChange={setFilterStatus}><Option value="paid">Đã thanh toán</Option><Option value="pending">Chờ xử lý</Option><Option value="failed">Thất bại</Option></Select></Col>
                <Col span={4}><Select placeholder="Gói học" style={{ width: '100%' }} allowClear value={filterPackage} onChange={setFilterPackage}><Option value="1m">Gói 1 Tháng</Option><Option value="3m">Gói 3 Tháng</Option><Option value="lifetime">Gói Trọn đời</Option></Select></Col>
                <Col span={4} style={{ textAlign: 'right' }}>
                  <Button icon={<ReloadOutlined />} onClick={() => {
                    setSearchText('');
                    setFilterStatus(undefined);
                    setFilterPackage(undefined);
                    setDateRange(null);
                    loadOrders();
                  }}>Xóa lọc</Button>
                </Col>
              </Row>
              <Table
              scroll={{ x: 'max-content' }}
                loading={loading}
                dataSource={filteredOrders}
                columns={columns}
                rowKey="_id"
                pagination={{
                  current: pagination.page,
                  pageSize: pagination.limit,
                  total: pagination.total,
                  onChange: (page) => setPagination(prev => ({ ...prev, page }))
                }}
              />
            </>
          )
        },
        {
          key: '2', label: <span><DollarOutlined /> Báo cáo Doanh thu</span>,
          children: (
            <>
              <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f5f5', padding: 10, borderRadius: 8 }}>
                <Space>
                  <span style={{ fontWeight: 600 }}>Xem theo: </span>
                  <Select value={reportType} onChange={setReportType} style={{ width: 120 }}>
                    <Option value="date">Ngày</Option>
                    <Option value="month">Tháng</Option>
                    <Option value="year">Năm</Option>
                  </Select>
                  <DatePicker picker={reportType} value={reportDate} onChange={setReportDate} allowClear={false} />
                </Space>
                <Space>
                  <Button type="primary" ghost icon={<FileExcelOutlined />} onClick={handleExportCSV}>Xuất Excel</Button>
                  <Button danger icon={<FilePdfOutlined />} onClick={handleExportPDF}>Xuất PDF</Button>
                </Space>
              </div>

              <div id="report-section" style={{ padding: 20, background: '#fff' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <Title level={4} style={{ margin: 0, textTransform: 'uppercase' }}>Báo cáo doanh thu {reportData.label}</Title>
                  <Text type="secondary">Đơn vị tính: VNĐ</Text>
                </div>
                {reportData.count === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, color: '#999' }}>Không có dữ liệu trong khoảng thời gian này</div>
                ) : (
                  <>
                    <Row gutter={16}>
                      <Col span={8}><Card bordered={false} style={{ background: '#f6ffed' }}><Statistic title="Tổng Doanh Thu" value={reportData.totalRev} precision={0} valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} prefix={<DollarOutlined />} suffix="VNĐ" /></Card></Col>
                      <Col span={8}><Card bordered={false} style={{ background: '#e6f7ff' }}><Statistic title="Tổng Đơn Hàng" value={reportData.count} valueStyle={{ color: '#1890ff', fontWeight: 'bold' }} prefix={<ShoppingCartOutlined />} /></Card></Col>
                      <Col span={8}><Card bordered={false} style={{ background: '#fff7e6' }}><Statistic title="Tỷ lệ thành công" value={reportData.rate} suffix="%" prefix={<RiseOutlined />} valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }} /></Card></Col>
                    </Row>
                    <br />
                    <Card title="Phân tích chi tiết" size="small"><Progress percent={100} success={{ percent: reportData.rate }} /></Card>
                  </>
                )}
              </div>
            </>
          )
        }
      ]} />
    </Card>
  );
};

export default OrderAdmin;