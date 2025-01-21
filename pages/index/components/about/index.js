Component({
  data: {
    version: '1.1.0',
    introduction: {
      title: '途规划师',
      desc: '这是一款专为个人设计的财务预测工具。只需将您的资产、收入、支出和负债填入对应模块，就能在趋势模块直观地看到资金的未来走势。\n\n通过月度涨幅分析和长期财务预测，它能帮您清晰规划买房、结婚等人生大事的资金准备。\n\n让每个人都能基于数据，科学规划财务未来，轻松掌握财富主动权！',
      privacy: '为了保护您的隐私，本小程序采用纯本地存储方式，所有数据仅保存在您的手机中，不会上传到任何服务器。您可以放心使用。'
    }
  },

  methods: {
    // 复制微信号
    copyWechat() {
      wx.setClipboardData({
        data: 'shen_xiao_long',
        success: () => {
          wx.showToast({
            title: '已复制我的微信号',
            icon: 'success'
          });
        }
      });
    },

    // 预览打赏码
    previewQrCode() {
      wx.previewImage({
        urls: ['/images/reward-qrcode.jpg'],
        current: '/images/reward-qrcode.jpg'
      });
    }
  }
}); 