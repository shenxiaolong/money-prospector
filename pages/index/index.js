Page({
  data: {
    currentTab: 5,
    tabLineLeft: '84%',
    tabList: [
      { id: 1, name: '资产' },
      { id: 2, name: '收入' },
      { id: 3, name: '支出' },
      { id: 4, name: '负债' },
      { id: 5, name: '趋势' },
      { id: 6, name: '关于' }
    ]
  },

  onLoad() {
    // 获取上次的tab位置
    const lastTab = wx.getStorageSync('lastTab');
    if (lastTab !== '') {
      const tabWidth = 100 / 6;
      const left = 4 + (lastTab * tabWidth);
      this.setData({
        currentTab: lastTab,
        tabLineLeft: left + '%'
      });
    }
  },

  onHide() {
    // 页面隐藏时保存当前tab位置
    wx.setStorageSync('lastTab', this.data.currentTab);
  },

  onUnload() {
    // 页面卸载时保存当前tab位置
    wx.setStorageSync('lastTab', this.data.currentTab);
  },

  // 切换标签页
  switchTab(e) {
    const index = Number(e.currentTarget.dataset.index);
    const tabWidth = 100 / 6;
    const left = 4 + (index * tabWidth);
    this.setData({
      tabLineLeft: left + '%',
      currentTab: index
    });
    // 保存当前tab位置
    wx.setStorageSync('lastTab', index);
  },

  // 分享给朋友
  onShareAppMessage: function () {
    return {
      title: '我在用这个小程序预测未来财务，提前规划财务自由！',
      path: '/pages/index/index',
      imageUrl: '/images/share-cover.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    return {
      title: '解锁财务自由：这款小程序帮我实现精准财务预测',
      query: '',
      imageUrl: '/images/share-cover.png'
    }
  }
});
