Component({
  data: {
    expenditureList: [], // 存储支出列表
    newExpenditure: {
      name: '', // 支出名称
      amount: '', // 支出金额
      type: 0, // 支出类型
      expenditureType: 1, // 支出类型：0-一次性支出，1-周期性支出
      period: 0, // 周期：0-每月，1-每年
      month: 0,  // 月份字段
      date: '', // 一次性支出时的日期
      remark: '' // 备注
    },
    expenditureTypes: ['餐饮', '购物', '交通', '娱乐', '居住', '其他'], // 支出类型选项
    showAddForm: false, // 控制添加表单的显示
    showDeleteModal: false, // 控制删除确认框的显示
    deleteExpenditureId: null, // 待删除支出的ID
    isEditing: false, // 是否处于编辑状态
    editingExpenditureId: null, // 正在编辑的支出ID
    expenditureTypeOptions: ['一次性支出', '周期性支出'],
    periodOptions: ['每月', '每年'],
    monthOptions: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  },

  lifetimes: {
    attached() {
      this.loadExpenditureData();
    }
  },

  methods: {
    loadExpenditureData() {
      try {
        const expenditureData = wx.getStorageSync('expenditureData');
        if (expenditureData) {
          this.setData({
            expenditureList: expenditureData
          });
        }
      } catch (e) {
        console.error('读取支出数据失败：', e);
        wx.showToast({
          title: '读取数据失败',
          icon: 'none'
        });
      }
    },

    saveExpenditureData(expenditureList) {
      try {
        wx.setStorageSync('expenditureData', expenditureList);
      } catch (e) {
        console.error('保存支出数据失败：', e);
        wx.showToast({
          title: '保存数据失败',
          icon: 'none'
        });
      }
    },

    showAddExpenditureForm() {
      this.setData({
        showAddForm: true,
        newExpenditure: {
          ...this.data.newExpenditure,
          date: this.formatDate(new Date())
        }
      });
    },

    hideAddExpenditureForm() {
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

    resetForm() {
      this.setData({
        showAddForm: false,
        isEditing: false,
        editingExpenditureId: null,
        newExpenditure: {
          name: '',
          amount: '',
          type: 0,
          expenditureType: 1,
          period: 0,
          month: 0,
          date: '',
          remark: ''
        }
      });
    },

    handleInput(e) {
      const { field } = e.currentTarget.dataset;
      const { value } = e.detail;
      this.setData({
        [`newExpenditure.${field}`]: value
      });
    },

    handleTypeChange(e) {
      this.setData({
        'newExpenditure.type': Number(e.detail.value)
      });
    },

    handleExpenditureTypeChange(e) {
      const expenditureType = Number(e.detail.value);
      this.setData({
        'newExpenditure.expenditureType': expenditureType,
        'newExpenditure.date': expenditureType === 0 ? this.formatDate(new Date()) : ''
      });
    },

    handleDateChange(e) {
      this.setData({
        'newExpenditure.date': e.detail.value
      });
    },

    handlePeriodChange(e) {
      this.setData({
        'newExpenditure.period': Number(e.detail.value)
      });
    },

    handleMonthChange(e) {
      this.setData({
        'newExpenditure.month': Number(e.detail.value)
      });
    },

    addExpenditure() {
      const { newExpenditure, expenditureList, isEditing, editingExpenditureId } = this.data;
      
      if (!newExpenditure.name || !newExpenditure.amount) {
        wx.showToast({
          title: '请填写完整信息',
          icon: 'none'
        });
        return;
      }

      if (newExpenditure.expenditureType === 1 && newExpenditure.period === 1 && newExpenditure.month === undefined) {
        wx.showToast({
          title: '请选择支出月份',
          icon: 'none'
        });
        return;
      }

      let updatedList;
      const newItem = {
        ...newExpenditure,
        amount: Number(newExpenditure.amount),
        id: isEditing ? editingExpenditureId : Date.now(),
        typeName: this.data.expenditureTypes[newExpenditure.type],
        expenditureTypeName: this.data.expenditureTypeOptions[newExpenditure.expenditureType],
        periodName: newExpenditure.expenditureType === 1 ? 
          (newExpenditure.period === 1 ? 
            `${this.data.periodOptions[newExpenditure.period]}(${this.data.monthOptions[newExpenditure.month]})` : 
            this.data.periodOptions[newExpenditure.period]) : 
          ''
      };

      if (isEditing) {
        updatedList = expenditureList.map(item => 
          item.id === editingExpenditureId ? newItem : item
        );
      } else {
        updatedList = [...expenditureList, newItem];
      }

      this.setData({
        expenditureList: updatedList,
        showAddForm: false,
        isEditing: false,
        editingExpenditureId: null,
        newExpenditure: {
          name: '',
          amount: '',
          type: 0,
          expenditureType: 1,
          period: 0,
          month: 0,
          date: '',
          remark: ''
        }
      });

      this.saveExpenditureData(updatedList);

      wx.showToast({
        title: isEditing ? '编辑成功' : '添加成功',
        icon: 'success'
      });
    },

    showDeleteConfirm(e) {
      const { id } = e.currentTarget.dataset;
      this.setData({
        showDeleteModal: true,
        deleteExpenditureId: id
      });
    },

    cancelDelete() {
      this.setData({
        showDeleteModal: false,
        deleteExpenditureId: null
      });
    },

    confirmDelete() {
      const { deleteExpenditureId, expenditureList } = this.data;
      const updatedList = expenditureList.filter(item => item.id !== deleteExpenditureId);
      
      this.setData({
        expenditureList: updatedList,
        showDeleteModal: false,
        deleteExpenditureId: null
      });

      this.saveExpenditureData(updatedList);

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    },

    showEditForm(e) {
      const { id } = e.currentTarget.dataset;
      const expenditure = this.data.expenditureList.find(item => item.id === id);
      
      let month = 0;
      if (expenditure.periodName && expenditure.periodName.includes('每年')) {
        const monthMatch = expenditure.periodName.match(/(\d+)月/);
        if (monthMatch) {
          month = Number(monthMatch[1]) - 1;
        }
      }

      this.setData({
        showAddForm: true,
        isEditing: true,
        editingExpenditureId: id,
        newExpenditure: {
          name: expenditure.name,
          amount: expenditure.amount,
          type: this.data.expenditureTypes.indexOf(expenditure.typeName),
          expenditureType: this.data.expenditureTypeOptions.indexOf(expenditure.expenditureTypeName),
          period: expenditure.periodName ? this.data.periodOptions.indexOf(expenditure.periodName.split('(')[0]) : 2,
          month: month,
          date: expenditure.date || '',
          remark: expenditure.remark || ''
        }
      });
    },

    formatDate(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${year}-${month}`;
    },

    generateMonthlyTrend(startAmount, monthlyIncome, monthlyExpenditure, oneTimeChanges) {
      const trend = [];
      const now = new Date();
      let currentAmount = startAmount;

      for (let i = 0; i < this.data.months; i++) {
        const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
        
        const monthChanges = oneTimeChanges.filter(change => {
          const changeMonth = new Date(change.date + '-01');
          return changeMonth.getFullYear() === month.getFullYear() && 
                 changeMonth.getMonth() === month.getMonth();
        });
      }
    }
  }
}); 