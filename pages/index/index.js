Page({
  data: {
    currentTab: 0,
    tabLineLeft: '4%',
    tabList: [
      { id: 1, name: '资产' },
      { id: 2, name: '收入' },
      { id: 3, name: '支出' },
      { id: 4, name: '负债' },
      { id: 5, name: '趋势' }
    ]
  },

  onLoad() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    
  },

  // 切换标签页
  switchTab(e) {
    const index = Number(e.currentTarget.dataset.index);
    const left = 4 + (index * 20); // 4% 初始偏移 + (tab索引 * 20%) + 4% 居中偏移
    this.setData({
      tabLineLeft: left + '%',
      currentTab: index
    });
  }
});
