// component.js
Component({
  data: {
    loanList: [], // 存储贷款列表
    newLoan: {
      name: '', // 贷款名称
      amount: '', // 贷款金额
      type: 0, // 贷款类型
      loanType: 1, // 贷款方式：0-无利息贷款，1-等额本息，2-等额本金
      endDate: '', // 结束还款日期
      rate: '', // 年利率
      isPaid: false, // 当月是否已还款
      remark: '' // 备注
    },
    loanTypes: ['房贷', '车贷', '信用卡', '网贷', '其他'], // 贷款类型选项
    showAddForm: false, // 控制添加表单的显示
    showDeleteModal: false, // 控制删除确认框的显示
    deleteLoanId: null, // 待删除贷款的ID
    isEditing: false, // 是否处于编辑状态
    editingLoanId: null, // 正在编辑的贷款ID
    loanTypeOptions: ['无利息贷款', '等额本息', '等额本金'],
    periodOptions: ['每日', '每周', '每月', '每年'],
    monthOptions: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  },

  lifetimes: {
    attached() {
      this.loadLoanData();
    }
  },

  methods: {
    loadLoanData() {
      try {
        const loanData = wx.getStorageSync('loanData');
        if (loanData) {
          this.setData({
            loanList: loanData
          });
        }
      } catch (e) {
        console.error('读取贷款数据失败：', e);
        wx.showToast({
          title: '读取数据失败',
          icon: 'none'
        });
      }
    },

    saveLoanData(loanList) {
      try {
        wx.setStorageSync('loanData', loanList);
      } catch (e) {
        console.error('保存贷款数据失败：', e);
        wx.showToast({
          title: '保存数据失败',
          icon: 'none'
        });
      }
    },

    showAddLoanForm() {
      this.setData({
        showAddForm: true,
        newLoan: {
          ...this.data.newLoan,
          endDate: this.formatDate(new Date())
        }
      });
    },

    hideAddLoanForm() {
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
        editingLoanId: null,
        newLoan: {
          name: '',
          amount: '',
          type: 0,
          loanType: 1,
          endDate: '',
          rate: '',
          isPaid: false,
          remark: ''
        }
      });
    },

    handleInput(e) {
      const { field } = e.currentTarget.dataset;
      const { value } = e.detail;
      this.setData({
        [`newLoan.${field}`]: value
      });
    },

    handleTypeChange(e) {
      this.setData({
        'newLoan.type': Number(e.detail.value)
      });
    },

    handleLoanTypeChange(e) {
      const loanType = Number(e.detail.value);
      this.setData({
        'newLoan.loanType': loanType
      });
    },

    handleEndDateChange(e) {
      this.setData({
        'newLoan.endDate': e.detail.value
      });
    },

    handleIsPaidChange(e) {
      this.setData({
        'newLoan.isPaid': e.detail.value
      });
    },

    addLoan() {
      const { newLoan, loanList, isEditing, editingLoanId } = this.data;
      
      if (!newLoan.name || !newLoan.amount) {
        wx.showToast({
          title: '请填写完整信息',
          icon: 'none'
        });
        return;
      }

      if ((newLoan.loanType === 1 || newLoan.loanType === 2) && (!newLoan.rate || !newLoan.endDate)) {
        wx.showToast({
          title: '请填写利率和结束日期',
          icon: 'none'
        });
        return;
      }

      let updatedList;
      const newItem = {
        ...newLoan,
        amount: Number(newLoan.amount),
        id: isEditing ? editingLoanId : Date.now(),
        typeName: this.data.loanTypes[newLoan.type],
        loanTypeName: this.data.loanTypeOptions[newLoan.loanType],
        isPaid: Boolean(newLoan.isPaid)
      };

      if (isEditing) {
        updatedList = loanList.map(item => 
          item.id === editingLoanId ? newItem : item
        );
      } else {
        updatedList = [...loanList, newItem];
      }

      this.setData({
        loanList: updatedList,
        showAddForm: false,
        isEditing: false,
        editingLoanId: null,
        newLoan: {
          name: '',
          amount: '',
          type: 0,
          loanType: 1,
          endDate: '',
          rate: '',
          isPaid: false,
          remark: ''
        }
      });

      this.saveLoanData(updatedList);

      wx.showToast({
        title: isEditing ? '编辑成功' : '添加成功',
        icon: 'success'
      });
    },

    showDeleteConfirm(e) {
      const { id } = e.currentTarget.dataset;
      this.setData({
        showDeleteModal: true,
        deleteLoanId: id
      });
    },

    cancelDelete() {
      this.setData({
        showDeleteModal: false,
        deleteLoanId: null
      });
    },

    confirmDelete() {
      const { deleteLoanId, loanList } = this.data;
      const updatedList = loanList.filter(item => item.id !== deleteLoanId);
      
      this.setData({
        loanList: updatedList,
        showDeleteModal: false,
        deleteLoanId: null
      });

      this.saveLoanData(updatedList);

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    },

    showEditForm(e) {
      const { id } = e.currentTarget.dataset;
      const loan = this.data.loanList.find(item => item.id === id);
      
      let month = 0;
      if (loan.periodName && loan.periodName.includes('每年')) {
        const monthMatch = loan.periodName.match(/(\d+)月/);
        if (monthMatch) {
          month = Number(monthMatch[1]) - 1;
        }
      }

      this.setData({
        showAddForm: true,
        isEditing: true,
        editingLoanId: id,
        newLoan: {
          name: loan.name,
          amount: loan.amount,
          type: this.data.loanTypes.indexOf(loan.typeName),
          loanType: this.data.loanTypeOptions.indexOf(loan.loanTypeName),
          endDate: loan.endDate || '',
          rate: loan.rate || '',
          isPaid: Boolean(loan.isPaid),
          remark: loan.remark || ''
        }
      });
    },

    showPaymentPlan(e) {
      const { id } = e.currentTarget.dataset;
      const loan = this.data.loanList.find(item => item.id === id);
      
      // 这里可以跳转到还款计划页面，或者显示还款计划弹窗
      wx.navigateTo({
        url: `/pages/payment-plan/index?id=${id}`
      });
    },

    formatDate(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${year}-${month}`;
    }
  }
});