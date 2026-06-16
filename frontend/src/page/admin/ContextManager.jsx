import React, { useState, useEffect } from 'react';
import {
  Card, Tabs, Table, Tag, Button, Typography, Spin, Alert, message,
  Space, Modal, Form, Input, InputNumber, Switch, Popconfirm, Select
} from 'antd';
import { DollarOutlined, AppstoreOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { adminService } from '../../services/adminService';
import { subscriptionService } from '../../services/subscriptionService';

const { Text } = Typography;

const ContextManager = () => {
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);
  const [savingPackage, setSavingPackage] = useState(false);
  const [savingTopic, setSavingTopic] = useState(false);
  const [packageForm] = Form.useForm();
  const [topicForm] = Form.useForm();

  useEffect(() => {
    loadPackages();
    loadTopics();
  }, []);

  const loadPackages = async () => {
    try {
      setPackagesLoading(true);
      const response = await subscriptionService.getPlansAdmin(true);
      if (response.success && Array.isArray(response.data)) {
        setPackages(
          response.data.map((plan) => ({
            key: plan.id,
            id: plan.id,
            code: String(plan.code || '').toUpperCase(),
            name: plan.name,
            type: plan.type,
            duration: plan.durationLabel || `${plan.duration || 0} ngày`,
            durationDays: plan.duration || 0,
            description: plan.features?.join(', ') || '',
            features: plan.features || [],
            price: plan.price || 0,
            discount: plan.discount,
            salePrice: plan.discount ? Math.max(0, plan.price - (plan.price * plan.discount) / 100) : plan.price || 0,
            status: plan.isActive ? 'active' : 'inactive',
            color: plan.color || '#597ef7',
            order: plan.order || 0,
            isPopular: !!plan.isPopular,
          }))
        );
      }
    } catch (error) {
      console.error('Load packages error:', error);
      message.error('Không thể tải danh sách gói học từ backend');
    } finally {
      setPackagesLoading(false);
    }
  };

  const loadTopics = async () => {
    try {
      setTopicsLoading(true);
      const response = await adminService.getConversationTopicsAdmin(true);
      if (response.success && Array.isArray(response.data)) {
        setTopics(
          response.data.map((topic) => ({
            key: topic.id,
            id: topic.id,
            name: topic.name,
            description: topic.description || '',
            icon: topic.icon || '💬',
            color: topic.color || '#1890ff',
            order: topic.order || 0,
            status: topic.isActive ? 'active' : 'inactive',
            count: topic.count || 0,
          }))
        );
      }
    } catch (error) {
      console.error('Load topics error:', error);
      message.error('Không thể tải danh sách chủ đề từ backend');
    } finally {
      setTopicsLoading(false);
    }
  };

  const openCreatePackage = () => {
    setEditingPackage(null);
    packageForm.resetFields();
    packageForm.setFieldsValue({
      type: 'basic',
      currency: 'VND',
      duration: 30,
      discount: null,
      isPopular: false,
      isActive: true,
      color: '#597ef7',
      order: 0,
      featuresText: '',
    });
    setIsPackageModalOpen(true);
  };

  const openEditPackage = (record) => {
    setEditingPackage(record);
    packageForm.setFieldsValue({
      code: record.code,
      name: record.name,
      type: record.type,
      price: record.price,
      currency: 'VND',
      duration: record.durationDays,
      durationLabel: record.duration,
      discount: record.discount,
      isPopular: record.isPopular,
      isActive: record.status === 'active',
      color: record.color,
      order: record.order,
      featuresText: (record.features || []).join('\n'),
    });
    setIsPackageModalOpen(true);
  };

  const submitPackage = async () => {
    try {
      const values = await packageForm.validateFields();
      setSavingPackage(true);
      const payload = {
        code: values.code,
        name: values.name,
        type: values.type,
        price: values.price,
        currency: values.currency,
        duration: values.duration,
        durationLabel: values.durationLabel,
        discount: values.discount ?? null,
        isPopular: !!values.isPopular,
        isActive: !!values.isActive,
        color: values.color,
        order: values.order,
        features: (values.featuresText || '')
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
      };

      if (editingPackage?.id) {
        await subscriptionService.updatePlan(editingPackage.id, payload);
        message.success('Đã cập nhật gói học');
      } else {
        await subscriptionService.createPlan(payload);
        message.success('Đã tạo gói học');
      }
      setIsPackageModalOpen(false);
      await loadPackages();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.error || 'Không thể lưu gói học');
    } finally {
      setSavingPackage(false);
    }
  };

  const handleDeletePackage = async (planId) => {
    try {
      await subscriptionService.deletePlan(planId);
      message.success('Đã ẩn gói học');
      await loadPackages();
    } catch (error) {
      message.error(error?.response?.data?.error || 'Không thể xóa gói học');
    }
  };

  const openCreateTopic = () => {
    setEditingTopic(null);
    topicForm.resetFields();
    topicForm.setFieldsValue({
      icon: '💬',
      color: '#1890ff',
      order: 0,
      isActive: true,
    });
    setIsTopicModalOpen(true);
  };

  const openEditTopic = (record) => {
    setEditingTopic(record);
    topicForm.setFieldsValue({
      name: record.name,
      description: record.description,
      icon: record.icon,
      color: record.color,
      order: record.order,
      isActive: record.status === 'active',
    });
    setIsTopicModalOpen(true);
  };

  const submitTopic = async () => {
    try {
      const values = await topicForm.validateFields();
      setSavingTopic(true);
      if (editingTopic?.id) {
        await adminService.updateConversationTopic(editingTopic.id, values);
        message.success('Đã cập nhật chủ đề');
      } else {
        await adminService.createConversationTopic(values);
        message.success('Đã tạo chủ đề');
      }
      setIsTopicModalOpen(false);
      await loadTopics();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.error || 'Không thể lưu chủ đề');
    } finally {
      setSavingTopic(false);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    try {
      await adminService.deleteConversationTopic(topicId);
      message.success('Đã ẩn chủ đề');
      await loadTopics();
    } catch (error) {
      message.error(error?.response?.data?.error || 'Không thể xóa chủ đề');
    }
  };

  const pkgColumns = [
    { title: 'Mã gói', dataIndex: 'code', render: (text) => <Tag color="purple">{text}</Tag> },
    {
      title: 'Tên & Mô tả',
      dataIndex: 'name',
      render: (text, row) => (
        <div>
          <b>{text}</b>
          <div style={{ fontSize: 12, color: '#888' }}>{row.description}</div>
        </div>
      )
    },
    { title: 'Thời gian', dataIndex: 'duration', align: 'center' },
    {
      title: 'Giá niêm yết',
      dataIndex: 'price',
      align: 'right',
      render: (value) => <Text delete style={{ color: '#999' }}>{value.toLocaleString()} đ</Text>
    },
    {
      title: 'Giá thực tế',
      dataIndex: 'salePrice',
      align: 'right',
      render: (value) => <Text type="danger" strong>{value.toLocaleString()} đ</Text>
    },
    {
      title: 'Nổi bật',
      dataIndex: 'isPopular',
      align: 'center',
      render: (value) => <Tag color={value ? 'gold' : 'default'}>{value ? 'YES' : 'NO'}</Tag>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      render: (value) => <Tag color={value === 'active' ? 'success' : 'default'}>{value.toUpperCase()}</Tag>
    },
    {
      title: 'Thao tác',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEditPackage(record)}>Sửa</Button>
          <Popconfirm
            title="Ẩn gói học này?"
            okText="Ẩn"
            cancelText="Hủy"
            onConfirm={() => handleDeletePackage(record.id)}
          >
            <Button size="small" danger>Ẩn</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const topicColumns = [
    { title: 'Tên Chủ đề', dataIndex: 'name', render: (text, row) => <b>{row.icon} {text}</b> },
    { title: 'Mô tả', dataIndex: 'description', render: (text) => text || <Text type="secondary">N/A</Text> },
    {
      title: 'Số hội thoại',
      dataIndex: 'count',
      align: 'center',
      render: (value) => <Tag color="blue">{value}</Tag>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      render: (value) => <Tag color={value === 'active' ? 'success' : 'default'}>{value.toUpperCase()}</Tag>
    },
    {
      title: 'Thao tác',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEditTopic(record)}>Sửa</Button>
          <Popconfirm
            title="Ẩn chủ đề này?"
            okText="Ẩn"
            cancelText="Hủy"
            onConfirm={() => handleDeleteTopic(record.id)}
          >
            <Button size="small" danger>Ẩn</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <>
    <Card title="Quản trị Nội dung" bordered={false}>
      <Tabs
        type="card"
        items={[
          {
            key: '1',
            label: <span><DollarOutlined /> Gói học (Packages)</span>,
            children: (
              <>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Alert
                    type="info"
                    showIcon
                    message="Dữ liệu gói học đồng bộ từ backend /subscriptions/plans và có CRUD đầy đủ."
                    description="Các thay đổi sẽ áp dụng trực tiếp lên dữ liệu backend."
                    style={{ marginRight: 12, flex: 1 }}
                  />
                  <Space>
                    <Button icon={<ReloadOutlined />} onClick={loadPackages}>Tải lại</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreatePackage}>Thêm gói</Button>
                  </Space>
                </div>
                <Spin spinning={packagesLoading}>
                  <Table scroll={{ x: 'max-content' }} dataSource={packages} columns={pkgColumns} rowKey="key" />
                </Spin>
              </>
            )
          },
          {
            key: '2',
            label: <span><AppstoreOutlined /> Danh mục Chủ đề</span>,
            children: (
              <>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Alert
                    type="info"
                    showIcon
                    message="Danh mục chủ đề đồng bộ từ backend /conversations/topics."
                    description="Tab này quản lý danh mục chủ đề, không quản lý nội dung hội thoại cụ thể."
                    style={{ marginRight: 12, flex: 1 }}
                  />
                  <Space>
                    <Button icon={<ReloadOutlined />} onClick={loadTopics}>Tải lại</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreateTopic}>Thêm chủ đề</Button>
                  </Space>
                </div>
                <Spin spinning={topicsLoading}>
                  <Table scroll={{ x: 'max-content' }} dataSource={topics} columns={topicColumns} rowKey="key" pagination={false} />
                </Spin>
              </>
            )
          }
        ]}
      />
    </Card>
    <Modal
      title={editingPackage ? 'Sửa gói học' : 'Thêm gói học'}
      open={isPackageModalOpen}
      onCancel={() => setIsPackageModalOpen(false)}
      onOk={submitPackage}
      confirmLoading={savingPackage}
      destroyOnClose
      width={700}
    >
      <Form form={packageForm} layout="vertical">
        <Form.Item name="code" label="Mã gói" rules={[{ required: true, message: 'Nhập mã gói' }]}>
          <Input placeholder="BASIC_MONTHLY" />
        </Form.Item>
        <Form.Item name="name" label="Tên gói" rules={[{ required: true, message: 'Nhập tên gói' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="type" label="Loại gói" rules={[{ required: true, message: 'Chọn loại gói' }]}>
          <Select
            options={[
              { value: 'free', label: 'Free' },
              { value: 'basic', label: 'Basic' },
              { value: 'premium', label: 'Premium' },
              { value: 'vip', label: 'VIP' },
            ]}
          />
        </Form.Item>
        <Form.Item name="price" label="Giá" rules={[{ required: true, message: 'Nhập giá' }]}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item name="duration" label="Số ngày" rules={[{ required: true, message: 'Nhập thời hạn' }]}>
          <InputNumber style={{ width: '100%' }} min={1} />
        </Form.Item>
        <Form.Item name="durationLabel" label="Nhãn thời hạn" rules={[{ required: true, message: 'Nhập nhãn thời hạn' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="discount" label="Giảm giá (%)">
          <InputNumber style={{ width: '100%' }} min={0} max={100} />
        </Form.Item>
        <Form.Item name="order" label="Thứ tự">
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item name="color" label="Màu">
          <Input />
        </Form.Item>
        <Form.Item name="featuresText" label="Tính năng (mỗi dòng một mục)">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item name="isPopular" label="Gói nổi bật" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="isActive" label="Hoạt động" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
    <Modal
      title={editingTopic ? 'Sửa chủ đề' : 'Thêm chủ đề'}
      open={isTopicModalOpen}
      onCancel={() => setIsTopicModalOpen(false)}
      onOk={submitTopic}
      confirmLoading={savingTopic}
      destroyOnClose
    >
      <Form form={topicForm} layout="vertical">
        <Form.Item name="name" label="Tên chủ đề" rules={[{ required: true, message: 'Nhập tên chủ đề' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="icon" label="Icon">
          <Input />
        </Form.Item>
        <Form.Item name="color" label="Màu">
          <Input />
        </Form.Item>
        <Form.Item name="order" label="Thứ tự">
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item name="isActive" label="Hoạt động" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
    </>
  );
};

export default ContextManager;