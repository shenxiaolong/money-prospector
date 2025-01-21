Page({
  data: {
    loan: null,
    paymentPlan: [],
    summary: {
      totalPayment: 0,
      totalInterest: 0
    }
  },

  onLoad(options) {
    const { id } = options;
    this.loadLoanData(id);
  },

  loadLoanData(id) {
    try {
      const loanList = wx.getStorageSync('loanData');
      if (loanList) {
        const loan = loanList.find(item => item.id === Number(id));
        if (loan) {
          this.setData({ loan });
          this.calculatePaymentPlan(loan);
        }
      }
    } catch (e) {
      console.error('读取贷款数据失败：', e);
      wx.showToast({
        title: '读取数据失败',
        icon: 'none'
      });
    }
  },

  calculatePaymentPlan(loan) {
    const startDate = new Date();
    if (loan.isPaid) {
      startDate.setMonth(startDate.getMonth() + 1);
    }
    const endDate = new Date(loan.endDate);
    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                 (endDate.getMonth() - startDate.getMonth()) + 1;
    
    if (endDate.getMonth() < startDate.getMonth()) {
      months -= 12;
    }

    if (months <= 0) {
      wx.showToast({
        title: '已完成所有还款',
        icon: 'success'
      });
      this.setData({
        paymentPlan: [],
        summary: {
          totalPayment: 0,
          totalInterest: 0
        }
      });
      return;
    }

    const monthlyRate = loan.rate / 100 / 12;
    const amount = loan.amount;

    let paymentPlan = [];
    let totalPayment = 0;
    let totalInterest = 0;

    if (loan.loanType === 1) {  // 等额本息
      // 月供 = 贷款本金 × 月利率 × (1+月利率)^还款月数 ÷ [(1+月利率)^还款月数-1]
      const monthlyPayment = amount * monthlyRate * Math.pow(1 + monthlyRate, months) / 
                            (Math.pow(1 + monthlyRate, months) - 1);

      let remainingPrincipal = amount;
      for (let i = 1; i <= months; i++) {
        const interest = remainingPrincipal * monthlyRate;
        const principal = monthlyPayment - interest;
        remainingPrincipal -= principal;

        const date = new Date(startDate);
        date.setMonth(startDate.getMonth() + i - 1);

        paymentPlan.push({
          period: i,
          date: this.formatDate(date),
          payment: monthlyPayment.toFixed(2),
          principal: principal.toFixed(2),
          interest: interest.toFixed(2)
        });

        totalPayment += monthlyPayment;
        totalInterest += interest;
      }
    } else if (loan.loanType === 2) {  // 等额本金
      const monthlyPrincipal = amount / months;

      let remainingPrincipal = amount;
      for (let i = 1; i <= months; i++) {
        const interest = remainingPrincipal * monthlyRate;
        const payment = monthlyPrincipal + interest;
        remainingPrincipal -= monthlyPrincipal;

        const date = new Date(startDate);
        date.setMonth(startDate.getMonth() + i - 1);

        paymentPlan.push({
          period: i,
          date: this.formatDate(date),
          payment: payment.toFixed(2),
          principal: monthlyPrincipal.toFixed(2),
          interest: interest.toFixed(2)
        });

        totalPayment += payment;
        totalInterest += interest;
      }
    }

    this.setData({
      paymentPlan,
      summary: {
        totalPayment: totalPayment.toFixed(2),
        totalInterest: totalInterest.toFixed(2)
      }
    });
  },

  formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }
}); 