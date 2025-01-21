Component({
  data: {
    incomeList: [], // 存储收入列表
    newIncome: {
      name: '', // 收入名称
      amount: '', // 收入金额
      type: 0, // 收入类型
      incomeType: 1, // 收入类型：0-一次性收入，1-周期性收入
      period: 0, // 周期：0-每月，1-每年
      month: 0,  // 月份字段
      date: '', // 一次性收入时的日期
      remark: '' // 备注
    },
    incomeTypes: ['工资', '奖金', '投资', '兼职', '其他'], // 收入类型选项
    showAddForm: false, // 控制添加表单的显示
    showDeleteModal: false, // 控制删除确认框的显示
    deleteIncomeId: null, // 待删除收入的ID
    isEditing: false, // 是否处于编辑状态
    editingIncomeId: null, // 正在编辑的收入ID
    incomeTypeOptions: ['一次性收入', '周期性收入'],
    periodOptions: ['每月', '每年'],
    monthOptions: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  },

  lifetimes: {
    attached() {
      // 组件加载时从本地存储读取数据
      this.loadIncomeData();
    }
  },

  methods: {
    // 从本地存储加载数据
    loadIncomeData() {
      try {
        const incomeData = wx.getStorageSync('incomeData');
        if (incomeData) {
          this.setData({
            incomeList: incomeData
          });
        }
      } catch (e) {
        console.error('读取收入数据失败：', e);
        wx.showToast({
          title: '读取数据失败',
          icon: 'none'
        });
      }
    },

    // 保存数据到本地存储
    saveIncomeData(incomeList) {
      try {
        wx.setStorageSync('incomeData', incomeList);
      } catch (e) {
        console.error('保存收入数据失败：', e);
        wx.showToast({
          title: '保存数据失败',
          icon: 'none'
        });
      }
    },

    // 显示添加收入表单
    showAddIncomeForm() {
      this.setData({
        showAddForm: true,
        newIncome: {
          ...this.data.newIncome,
          date: this.formatDate(new Date()) // 设置默认日期为今天
        }
      });
    },

    // 隐藏添加收入表单
    hideAddIncomeForm() {
      // 如果正在编辑，需要用户确认是否放弃编辑
      if (this.data.isEditing) {
        wx.showModal({
          title: '提示',
          content: '确定要放弃编辑吗？',
          success: (res) => {
            if (res.confirm) {
              this.resetForm();
            }
          }
        });
      } else {
        this.resetForm();
      }
    },

    // 重置表单
    resetForm() {
      this.setData({
        showAddForm: false,
        isEditing: false,
        editingIncomeId: null,
        newIncome: {
          name: '',
          amount: '',
          type: 0,
          incomeType: 1,
          period: 0,
          month: 0,
          date: '',
          remark: ''
        }
      });
    },

    // 处理输入
    handleInput(e) {
      const { field } = e.currentTarget.dataset;
      const { value } = e.detail;
      this.setData({
        [`newIncome.${field}`]: value
      });
    },

    // 处理收入类型选择（工资、奖金等）
    handleTypeChange(e) {
      this.setData({
        'newIncome.type': Number(e.detail.value)
      });
    },

    // 处理收入方式选择（一次性/周期性）
    handleIncomeTypeChange(e) {
      const incomeType = Number(e.detail.value);
      this.setData({
        'newIncome.incomeType': incomeType,
        // 切换到一次性收入时，设置默认日期为今天
        'newIncome.date': incomeType === 0 ? this.formatDate(new Date()) : ''
      });
    },

    // 处理日期选择
    handleDateChange(e) {
      this.setData({
        'newIncome.date': e.detail.value
      });
    },

    // 处理周期选择
    handlePeriodChange(e) {
      this.setData({
        'newIncome.period': Number(e.detail.value)
      });
    },

    // 处理月份选择
    handleMonthChange(e) {
      this.setData({
        'newIncome.month': Number(e.detail.value)
      });
    },

    // 添加收入
    addIncome() {
      const { newIncome, incomeList, isEditing, editingIncomeId } = this.data;
      
      if (!newIncome.name || !newIncome.amount) {
        wx.showToast({
          title: '请填写完整信息',
          icon: 'none'
        });
        return;
      }

      // 年度收入必须选择月份
      if (newIncome.incomeType === 1 && newIncome.period === 1 && newIncome.month === undefined) {
        wx.showToast({
          title: '请选择收入月份',
          icon: 'none'
        });
        return;
      }

      let updatedList;
      const newItem = {
        ...newIncome,
        amount: Number(newIncome.amount),
        id: isEditing ? editingIncomeId : Date.now(),
        typeName: this.data.incomeTypes[newIncome.type],
        incomeTypeName: this.data.incomeTypeOptions[newIncome.incomeType],
        periodName: newIncome.incomeType === 1 ? 
          (newIncome.period === 1 ? 
            `${this.data.periodOptions[newIncome.period]}(${this.data.monthOptions[newIncome.month]})` : 
            this.data.periodOptions[newIncome.period]) : 
          ''
      };

      if (isEditing) {
        updatedList = incomeList.map(item => 
          item.id === editingIncomeId ? newItem : item
        );
      } else {
        updatedList = [...incomeList, newItem];
      }

      this.setData({
        incomeList: updatedList,
        showAddForm: false,
        isEditing: false,
        editingIncomeId: null,
        newIncome: {
          name: '',
          amount: '',
          type: 0,
          incomeType: 1,
          period: 0,
          month: 0,
          date: '',
          remark: ''
        }
      });

      this.saveIncomeData(updatedList);

      wx.showToast({
        title: isEditing ? '编辑成功' : '添加成功',
        icon: 'success'
      });
    },

    // 显示删除确认框
    showDeleteConfirm(e) {
      const { id } = e.currentTarget.dataset;
      this.setData({
        showDeleteModal: true,
        deleteIncomeId: id
      });
    },

    // 取消删除
    cancelDelete() {
      this.setData({
        showDeleteModal: false,
        deleteIncomeId: null
      });
    },

    // 确认删除
    confirmDelete() {
      const { deleteIncomeId, incomeList } = this.data;
      const updatedList = incomeList.filter(item => item.id !== deleteIncomeId);
      
      this.setData({
        incomeList: updatedList,
        showDeleteModal: false,
        deleteIncomeId: null
      });

      this.saveIncomeData(updatedList);

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    },

    // 显示编辑表单
    showEditForm(e) {
      const { id } = e.currentTarget.dataset;
      const income = this.data.incomeList.find(item => item.id === id);
      
      // 解析月份信息
      let month = 0;
      if (income.periodName && income.periodName.includes('每年')) {
        const monthMatch = income.periodName.match(/(\d+)月/);
        if (monthMatch) {
          month = Number(monthMatch[1]) - 1;
        }
      }

      this.setData({
        showAddForm: true,
        isEditing: true,
        editingIncomeId: id,
        newIncome: {
          name: income.name,
          amount: income.amount,
          type: this.data.incomeTypes.indexOf(income.typeName),
          incomeType: this.data.incomeTypeOptions.indexOf(income.incomeTypeName),
          period: income.periodName ? this.data.periodOptions.indexOf(income.periodName.split('(')[0]) : 2,
          month: month,
          date: income.date || '',
          remark: income.remark || ''
        }
      });
    },

    // 格式化日期
    formatDate(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${year}-${month}`;
    }
  }
});