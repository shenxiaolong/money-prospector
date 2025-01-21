Component({
  data: {
    assetsList: [], // 存储资产列表
    newAsset: {
      name: '', // 资产名称
      amount: '', // 资产金额
      type: 0, // 资产类型
      remark: '' // 备注
    },
    totalAssets: 0, // 总资产
    assetTypes: ['现金', '银行存款', '基金理财', '股票', '其他'], // 资产类型选项
    showAddForm: false, // 控制添加表单的显示
    showDeleteModal: false, // 控制删除确认框的显示
    deleteAssetId: null, // 待删除资产的ID
    isEditing: false, // 是否处于编辑状态
    editingAssetId: null, // 正在编辑的资产ID
    assetTypeStats: [], // 添加资产类型统计数据
    formScrollId: 'addForm', // 添加表单的滚动ID
    isStatsExpanded: false, // 添加资产分布展开状态控制
  },

  // 添加生命周期函数
  lifetimes: {
    attached() {
      // 组件加载时从本地存储读取数据
      this.loadAssetsData();
    }
  },

  methods: {
    // 从本地存储加载数据
    loadAssetsData() {
      try {
        const assetsData = wx.getStorageSync('assetsData');
        if (assetsData) {
          this.setData({
            assetsList: assetsData
          });
          this.calculateTotal(); // 这里会同时调用 calculateAssetStats
        }
      } catch (e) {
        console.error('读取资产数据失败：', e);
        wx.showToast({
          title: '读取数据失败',
          icon: 'none'
        });
      }
    },

    // 保存数据到本地存储
    saveAssetsData(assetsList) {
      try {
        wx.setStorageSync('assetsData', assetsList);
      } catch (e) {
        console.error('保存资产数据失败：', e);
        wx.showToast({
          title: '保存数据失败',
          icon: 'none'
        });
      }
    },

    // 显示添加资产表单
    showAddAssetForm() {
      this.setData({
        showAddForm: true
      }, () => {
        // 使用延时确保视图已更新
        setTimeout(() => {
          const query = wx.createSelectorQuery().in(this);
          query.select('#addForm').boundingClientRect();
          query.selectViewport().scrollOffset();
          query.exec((res) => {
            if (res[0] && res[1]) {
              wx.pageScrollTo({
                scrollTop: res[0].top + res[1].scrollTop - 20,
                duration: 300
              });
            }
          });
        }, 100);
      });
    },

    // 隐藏添加资产表单
    hideAddAssetForm() {
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
        editingAssetId: null,
        newAsset: {
          name: '',
          amount: '',
          type: 0,
          remark: ''
        }
      });
    },

    // 处理输入
    handleInput(e) {
      const { field } = e.currentTarget.dataset;
      const { value } = e.detail;
      this.setData({
        [`newAsset.${field}`]: value
      });
    },

    // 处理资产类型选择
    handleTypeChange(e) {
      this.setData({
        'newAsset.type': Number(e.detail.value)
      });
    },

    // 添加资产
    addAsset() {
      const { newAsset, assetsList, isEditing, editingAssetId } = this.data;
      
      if (!newAsset.name || !newAsset.amount) {
        wx.showToast({
          title: '请填写完整信息',
          icon: 'none'
        });
        return;
      }

      const amount = Number(newAsset.amount);
      if (isNaN(amount) || amount <= 0) {
        wx.showToast({
          title: '请输入有效金额',
          icon: 'none'
        });
        return;
      }

      let updatedList;
      if (isEditing) {
        // 编辑现有资产
        updatedList = assetsList.map(item => {
          if (item.id === editingAssetId) {
            return {
              ...newAsset,
              id: editingAssetId,
              amount: amount,
              typeName: this.data.assetTypes[newAsset.type]
            };
          }
          return item;
        });
      } else {
        // 添加新资产
        updatedList = [...assetsList, {
          ...newAsset,
          amount: amount,
          id: Date.now(),
          typeName: this.data.assetTypes[newAsset.type]
        }];
      }

      this.setData({
        assetsList: updatedList,
        showAddForm: false,
        isEditing: false,
        editingAssetId: null,
        newAsset: {
          name: '',
          amount: '',
          type: 0,
          remark: ''
        }
      });

      // 保存到本地存储
      this.saveAssetsData(updatedList);
      this.calculateTotal();

      wx.showToast({
        title: isEditing ? '编辑成功' : '添加成功',
        icon: 'success'
      });
    },

    // 删除资产
    deleteAsset(e) {
      const { id } = e.currentTarget.dataset;
      const updatedList = this.data.assetsList.filter(item => item.id !== id);
      
      this.setData({
        assetsList: updatedList
      });

      this.calculateTotal();
    },

    // 计算总资产
    calculateTotal() {
      const total = this.data.assetsList.reduce((sum, asset) => sum + Number(asset.amount), 0);
      this.setData({
        totalAssets: total
      });
      // 更新统计数据
      this.calculateAssetStats();
    },

    // 显示删除确认框
    showDeleteConfirm(e) {
      const { id } = e.currentTarget.dataset;
      this.setData({
        showDeleteModal: true,
        deleteAssetId: id
      });
    },

    // 取消删除
    cancelDelete() {
      this.setData({
        showDeleteModal: false,
        deleteAssetId: null
      });
    },

    // 确认删除
    confirmDelete() {
      const { deleteAssetId, assetsList } = this.data;
      const updatedList = assetsList.filter(item => item.id !== deleteAssetId);
      
      this.setData({
        assetsList: updatedList,
        showDeleteModal: false,
        deleteAssetId: null
      });

      // 保存到本地存储
      this.saveAssetsData(updatedList);
      this.calculateTotal();

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    },

    // 显示编辑表单
    showEditForm(e) {
      const { id } = e.currentTarget.dataset;
      const asset = this.data.assetsList.find(item => item.id === id);
      
      this.setData({
        showAddForm: true,
        isEditing: true,
        editingAssetId: id,
        newAsset: {
          name: asset.name,
          amount: asset.amount,
          type: this.data.assetTypes.indexOf(asset.typeName),
          remark: asset.remark || ''
        }
      }, () => {
        // 使用延时确保视图已更新
        setTimeout(() => {
          const query = wx.createSelectorQuery().in(this);
          query.select('#addForm').boundingClientRect();
          query.selectViewport().scrollOffset();
          query.exec((res) => {
            if (res[0] && res[1]) {
              wx.pageScrollTo({
                scrollTop: res[0].top + res[1].scrollTop - 20,
                duration: 300
              });
            }
          });
        }, 100);
      });
    },

    // 计算资产统计数据
    calculateAssetStats() {
      const { assetsList, assetTypes } = this.data;
      
      // 初始化统计数据
      const typeStats = assetTypes.map(type => ({
        type,
        amount: 0,
        percentage: 0,
        count: 0
      }));

      // 计算各类型资产总额
      assetsList.forEach(asset => {
        const typeIndex = assetTypes.indexOf(asset.typeName);
        if (typeIndex !== -1) {
          typeStats[typeIndex].amount += Number(asset.amount);
          typeStats[typeIndex].count += 1;
        }
      });

      // 计算总资产
      const totalAmount = typeStats.reduce((sum, stat) => sum + stat.amount, 0);

      // 计算百分比
      typeStats.forEach(stat => {
        stat.percentage = totalAmount > 0 ? (stat.amount / totalAmount * 100).toFixed(2) : 0;
        stat.amount = Number(stat.amount.toFixed(2));
      });

      this.setData({
        assetTypeStats: typeStats
      });
    },

    // 切换资产分布展开状态
    toggleStats() {
      this.setData({
        isStatsExpanded: !this.data.isStatsExpanded
      });
    },
  }
}); 