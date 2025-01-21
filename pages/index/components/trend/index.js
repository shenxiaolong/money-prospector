Component({
  data: {
    monthlyTrend: [], // 存储每月趋势数据
    startAmount: 0,   // 起始金额（当前资产总额）
    monthlyIncome: 0, // 每月固定收入
    monthlyExpenditure: 0, // 每月固定支出
    oneTimeChanges: [], // 一次性收支变动
    selectedYears: 5,  // 默认选择5年
    columnSettings: {
      income: true,
      expense: true,
      loan: true,
      balance: false,
      assets: true,
      remainingLoan: false
    }
  },

  lifetimes: {
    attached() {
      // 从本地存储读取用户的列显示设置
      const columnSettings = wx.getStorageSync('trendColumnSettings');
      if (columnSettings) {
        this.setData({ columnSettings });
      }
      this.calculateTrend();
    }
  },

  methods: {
    // 计算趋势
    calculateTrend() {
      // 1. 计算当前资金（资产总额 - 无利息贷款总额）
      const assets = wx.getStorageSync('assetsData') || [];
      const assetsTotal = assets.reduce((sum, asset) => sum + Number(asset.amount), 0);
      
      const loans = wx.getStorageSync('loanData') || [];
      const noInterestLoansTotal = loans
        .filter(loan => loan.loanType === 0)  // 筛选无利息贷款
        .reduce((sum, loan) => sum + Number(loan.amount), 0);
      
      const startAmount = this.formatAmount(assetsTotal - noInterestLoansTotal);

      // 2. 获取收入数据
      const incomeList = wx.getStorageSync('incomeData') || [];
      
      // 3. 获取支出数据
      const expenditureList = wx.getStorageSync('expenditureData') || [];

      // 4. 计算月平均收益
      const monthlyIncome = this.formatAmount(this.calculateAverageMonthlyIncome(incomeList));

      // 5. 计算每月固定支出
      const monthlyExpenditure = this.formatAmount(this.calculateAverageMonthlyExpenditure(expenditureList));

      // 6. 获取一次性收支变动
      const oneTimeChanges = this.getOneTimeChanges(incomeList, expenditureList);

      this.setData({
        startAmount,
        monthlyIncome,
        monthlyExpenditure,
        oneTimeChanges
      });

      // 7. 生成月度趋势数据
      this.generateMonthlyTrend();
    },

    // 计算月平均收益
    calculateAverageMonthlyIncome(incomeList) {
      let monthlyTotal = 0;
      let yearlyTotal = 0;
      
      incomeList.forEach(income => {
        if (income.incomeType === 1) { // 周期性收入
          const amount = Number(income.amount);
          if (income.period === 0) { // 每月
            monthlyTotal += amount;
          } else if (income.period === 1) { // 每年
            yearlyTotal += amount;
          }
        }
      });

      // 计算月平均收益：每月收入 + (年收入总和/12)
      return monthlyTotal + (yearlyTotal / 12);
    },

    // 计算每月固定支出
    calculateAverageMonthlyExpenditure(expenditureList) {
      let monthlyTotal = 0;
      let yearlyTotal = 0;
      
      expenditureList.forEach(expenditure => {
        if (expenditure.expenditureType === 1) { // 周期性支出
          const amount = Number(expenditure.amount);
          if (expenditure.period === 0) { // 每月
            monthlyTotal += amount;
          } else if (expenditure.period === 1) { // 每年
            yearlyTotal += amount;
          }
        }
      });

      // 计算月平均支出：每月支出 + (年支出总和/12)
      return monthlyTotal + (yearlyTotal / 12);
    },

    // 获取一次性收支变动
    getOneTimeChanges(incomeList, expenditureList) {
      const changes = [];
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const { selectedYears } = this.data;

      // 处理一次性收入
      incomeList.forEach(income => {
        if (income.incomeType === 0) {  // 一次性收入
          changes.push({
            date: income.date,
            amount: Number(income.amount),
            type: 'income',
            name: income.name
          });
        } else if (income.incomeType === 1 && income.period === 1) {  // 年度收入
          // 获取收入月份
          const incomeMonth = Number(income.periodValue);
          // 根据用户选择的年数计算年度收入
          for (let year = currentYear; year <= currentYear + selectedYears; year++) {
            // 如果是当年且月份已过，跳到下一年
            if (year === currentYear && incomeMonth < currentMonth) {
              continue;
            }
            changes.push({
              date: `${year}-${String(incomeMonth).padStart(2, '0')}-01`,
              amount: Number(income.amount),
              type: 'income',
              name: income.name
            });
          }
        }
      });

      // 处理一次性支出
      expenditureList.forEach(expenditure => {
        if (expenditure.expenditureType === 0) {  // 一次性支出
          changes.push({
            date: expenditure.date,
            amount: -Number(expenditure.amount),
            type: 'expenditure',
            name: expenditure.name
          });
        } else if (expenditure.expenditureType === 1 && expenditure.period === 1) {  // 年度支出
          // 获取支出月份
          const expenditureMonth = Number(expenditure.periodValue);
          // 根据用户选择的年数计算年度支出
          for (let year = currentYear; year <= currentYear + selectedYears; year++) {
            // 如果是当年且月份已过，跳到下一年
            if (year === currentYear && expenditureMonth < currentMonth) {
              continue;
            }
            changes.push({
              date: `${year}-${String(expenditureMonth).padStart(2, '0')}-01`,
              amount: -Number(expenditure.amount),
              type: 'expenditure',
              name: expenditure.name
            });
          }
        }
      });

      // 按日期排序
      return changes.sort((a, b) => a.date.localeCompare(b.date));
    },

    // 添加格式化金额的方法
    formatAmount(amount) {
      return Math.floor(amount);
    },

    // 添加格式化月份的方法
    formatMonth(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${year}-${month}`;
    },

    // 生成月度趋势数据
    generateMonthlyTrend() {
      const { startAmount, selectedYears } = this.data;
      const trend = [];
      const now = new Date();
      const months = selectedYears * 12;
      let totalAssets = startAmount;

      for (let i = 0; i < months; i++) {
        const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const currentYear = month.getFullYear();
        const currentMonth = month.getMonth() + 1;
        
        // 计算当月收入
        const expectedIncome = this.calculateMonthIncome(currentYear, currentMonth);
        
        // 计算当月支出
        const expectedExpense = this.calculateMonthExpense(currentYear, currentMonth);
        
        // 计算当月还贷
        const monthlyLoan = this.calculateMonthLoan(currentYear, currentMonth);
        
        // 计算月结余
        const monthlyBalance = expectedIncome - expectedExpense - monthlyLoan;
        
        // 更新总资产
        totalAssets = totalAssets + monthlyBalance;
        
        // 计算剩余贷款
        const remainingLoan = this.calculateRemainingLoan(currentYear, currentMonth);

        trend.push({
          month: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
          expectedIncome: this.formatAmount(expectedIncome),
          expectedExpense: this.formatAmount(expectedExpense),
          monthlyLoan: this.formatAmount(monthlyLoan),
          monthlyBalance: this.formatAmount(monthlyBalance),
          totalAssets: this.formatAmount(totalAssets),
          remainingLoan: this.formatAmount(remainingLoan)
        });
      }

      this.setData({
        monthlyTrend: trend
      });
    },

    // 计算指定月份的收入
    calculateMonthIncome(year, month) {
      const incomeList = wx.getStorageSync('incomeData') || [];
      let monthIncome = 0;
      
      incomeList.forEach(income => {
        const amount = Number(income.amount);
        
        if (income.incomeType === 1) { // 周期性收入
          if (income.period === 0) { // 每月
            monthIncome += amount;
          } else if (income.period === 1 && Number(income.month) + 1 === month) { // 每年且是当月
            monthIncome += amount;
          }
        } else if (income.incomeType === 0) { // 一次性收入
          const incomeDate = new Date(income.date);
          if (incomeDate.getFullYear() === year && incomeDate.getMonth() + 1 === month) {
            monthIncome += amount;
          }
        }
      });
      
      return monthIncome;
    },

    // 计算指定月份的支出
    calculateMonthExpense(year, month) {
      const expenditureList = wx.getStorageSync('expenditureData') || [];
      let monthExpense = 0;
      
      expenditureList.forEach(expenditure => {
        const amount = Number(expenditure.amount);
        
        if (expenditure.expenditureType === 1) { // 周期性支出
          if (expenditure.period === 0) { // 每月
            monthExpense += amount;
          } else if (expenditure.period === 1 && Number(expenditure.month) + 1 === month) { // 每年且是当月
            monthExpense += amount;
          }
        } else if (expenditure.expenditureType === 0) { // 一次性支出
          const expenseDate = new Date(expenditure.date);
          if (expenseDate.getFullYear() === year && expenseDate.getMonth() + 1 === month) {
            monthExpense += amount;
          }
        }
      });
      
      return monthExpense;
    },

    // 计算指定月份的还贷
    calculateMonthLoan(year, month) {
      const loanList = wx.getStorageSync('loanData') || [];
      let monthLoan = 0;
      
      loanList.forEach(loan => {
        // 跳过一次性还款
        if (loan.loanType === 0) return;
        
        const amount = Number(loan.amount);
        const rate = Number(loan.rate) / 100 / 12;
        const endDate = new Date(loan.endDate);
        const startDate = new Date();
        
        if (loan.loanType === 1) {  // 等额本息
          const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                             (endDate.getMonth() - startDate.getMonth()) + 1;
          const monthlyPayment = amount * rate * Math.pow(1 + rate, totalMonths) / 
                               (Math.pow(1 + rate, totalMonths) - 1);
          monthLoan += monthlyPayment;
        } else if (loan.loanType === 2) {  // 等额本金
          const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                             (endDate.getMonth() - startDate.getMonth()) + 1;
          const principal = amount / totalMonths;
          const currentMonth = (year - startDate.getFullYear()) * 12 + 
                             (month - 1 - startDate.getMonth());
          const remainingPrincipal = amount - (principal * currentMonth);
          const interest = remainingPrincipal * rate;
          monthLoan += (principal + interest);
        }
      });
      
      return monthLoan;
    },

    // 计算剩余贷款
    calculateRemainingLoan(year, month) {
      const loanList = wx.getStorageSync('loanData') || [];
      let remainingLoan = 0;
      
      loanList.forEach(loan => {
        if (loan.loanType === 1 || loan.loanType === 2) { // 只计算周期性贷款
          const amount = Number(loan.amount);
          const endDate = new Date(loan.endDate);
          const startDate = new Date();
          
          // 如果当前月份在贷款期限内
          if (endDate >= new Date(year, month - 1)) {
            const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                (endDate.getMonth() - startDate.getMonth()) + 1;
            const currentMonth = (year - startDate.getFullYear()) * 12 + 
                                (month - 1 - startDate.getMonth());
            
            // 计算剩余本金
            const monthlyPrincipal = amount / totalMonths;
            // 包括当月的还款
            const paidPrincipal = monthlyPrincipal * (currentMonth + 1);
            remainingLoan += (amount - paidPrincipal);
          }
        }
      });
      
      return remainingLoan;
    },

    // 处理年份变化（拖动结束）
    handleYearChange(e) {
      const years = e.detail.value;
      this.setData({
        selectedYears: years
      }, () => {
        this.generateMonthlyTrend();
      });
    },

    // 处理年份变化（拖动中）
    handleYearChanging(e) {
      const years = e.detail.value;
      this.setData({
        selectedYears: years
      });
    },

    // 显示月平均收益的计算说明
    showIncomeExplanation() {
      wx.showToast({
        title: '月平均收益 = 每月固定收入 + (年度收入÷12)',
        icon: 'none',
        duration: 3000
      });
    },

    // 显示月平均支出的计算说明
    showExpenditureExplanation() {
      wx.showToast({
        title: '月平均支出 = 每月固定支出 + (年度支出÷12)',
        icon: 'none',
        duration: 3000
      });
    },

    // 显示当前资金的计算说明
    showCurrentFundsExplanation() {
      wx.showToast({
        title: '当前资金 = 总资产 - 无利息贷款总额',
        icon: 'none',
        duration: 3000
      });
    },

    // 显示表格各列的说明
    showTimeExplanation() {
      wx.showToast({
        title: '预测未来各月份的财务状况',
        icon: 'none',
        duration: 3000
      });
    },

    showTableIncomeExplanation() {
      wx.showToast({
        title: '当月固定收入 + 一次性收入 + 年度收入',
        icon: 'none',
        duration: 3000
      });
    },

    showTableExpenseExplanation() {
      wx.showToast({
        title: '当月固定支出 + 一次性支出 + 年度支出',
        icon: 'none',
        duration: 3000
      });
    },

    showTableLoanExplanation() {
      wx.showToast({
        title: '当月应还的贷款总额（本金+利息）',
        icon: 'none',
        duration: 3000
      });
    },

    showTableBalanceExplanation() {
      wx.showToast({
        title: '当月收入 - 支出 - 还贷',
        icon: 'none',
        duration: 3000
      });
    },

    showTableAssetsExplanation() {
      wx.showToast({
        title: '累计总资产 = 上月总资产 + 当月结余',
        icon: 'none',
        duration: 3000
      });
    },

    showTableRemainingLoanExplanation() {
      wx.showToast({
        title: '周期性贷款的剩余未还本金总额',
        icon: 'none',
        duration: 3000
      });
    },

    // 切换列显示状态
    toggleColumn(e) {
      const { column } = e.currentTarget.dataset;
      const newSettings = {
        ...this.data.columnSettings,
        [column]: !this.data.columnSettings[column]
      };
      
      this.setData({
        columnSettings: newSettings
      });
      
      // 保存用户的列显示设置到本地存储
      wx.setStorageSync('trendColumnSettings', newSettings);
    },

    // 显示收入明细
    showIncomeDetail(e) {
      const { month } = e.currentTarget.dataset;
      const [year, monthNum] = month.split('-');
      const monthlyIncome = this.calculateMonthIncome(Number(year), Number(monthNum));
      
      let detail = '收入明细：\n';
      const incomeList = wx.getStorageSync('incomeData') || [];
      
      // 固定收入
      const monthlyFixed = incomeList
        .filter(income => income.incomeType === 1 && income.period === 0)
        .reduce((sum, income) => sum + Number(income.amount), 0);
      detail += `月固定收入：${monthlyFixed}\n`;
      
      // 年度收入
      const yearlyIncomes = incomeList
        .filter(income => 
          income.incomeType === 1 && income.period === 1 && Number(income.month) + 1 === Number(monthNum)
        );
      if (yearlyIncomes.length > 0) {
        detail += `\n年度收入：\n`;
        yearlyIncomes.forEach(income => {
          detail += `${income.name}：${income.amount}\n`;
        });
      }
      
      // 一次性收入
      const oneTimeIncomes = incomeList
        .filter(income => {
          if (income.incomeType !== 0) return false;
          const incomeDate = new Date(income.date);
          return incomeDate.getFullYear() === Number(year) && incomeDate.getMonth() + 1 === Number(monthNum);
        });
      if (oneTimeIncomes.length > 0) {
        detail += `\n一次性收入：\n`;
        oneTimeIncomes.forEach(income => {
          detail += `${income.name}：${income.amount}\n`;
        });
      }
      
      const totalIncome = monthlyFixed + 
        yearlyIncomes.reduce((sum, income) => sum + Number(income.amount), 0) +
        oneTimeIncomes.reduce((sum, income) => sum + Number(income.amount), 0);
      detail += `\n总计：${totalIncome}`;
      
      wx.showModal({
        title: `${month} 收入明细`,
        content: detail,
        showCancel: false
      });
    },

    // 显示支出明细
    showExpenseDetail(e) {
      const { month } = e.currentTarget.dataset;
      const [year, monthNum] = month.split('-');
      const monthlyExpense = this.calculateMonthExpense(Number(year), Number(monthNum));
      
      let detail = '支出明细：\n';
      const expenditureList = wx.getStorageSync('expenditureData') || [];
      
      // 固定支出
      const monthlyFixed = expenditureList
        .filter(expense => expense.expenditureType === 1 && expense.period === 0)
        .reduce((sum, expense) => sum + Number(expense.amount), 0);
      detail += `月固定支出：${monthlyFixed}\n`;
      
      // 年度支出
      const yearlyExpenses = expenditureList
        .filter(expense => 
          expense.expenditureType === 1 && expense.period === 1 && Number(expense.month) + 1 === Number(monthNum)
        );
      if (yearlyExpenses.length > 0) {
        detail += `\n年度支出：\n`;
        yearlyExpenses.forEach(expense => {
          detail += `${expense.name}：${expense.amount}\n`;
        });
      }
      
      // 一次性支出
      const oneTimeExpenses = expenditureList
        .filter(expense => {
          if (expense.expenditureType !== 0) return false;
          const expenseDate = new Date(expense.date);
          return expenseDate.getFullYear() === Number(year) && expenseDate.getMonth() + 1 === Number(monthNum);
        });
      if (oneTimeExpenses.length > 0) {
        detail += `\n一次性支出：\n`;
        oneTimeExpenses.forEach(expense => {
          detail += `${expense.name}：${expense.amount}\n`;
        });
      }
      
      const totalExpense = monthlyFixed + 
        yearlyExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0) +
        oneTimeExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      detail += `\n总计：${totalExpense}`;
      
      wx.showModal({
        title: `${month} 支出明细`,
        content: detail,
        showCancel: false
      });
    },

    // 显示还贷明细
    showLoanDetail(e) {
      const { month } = e.currentTarget.dataset;
      const [year, monthNum] = month.split('-');
      const monthlyLoan = this.calculateMonthLoan(Number(year), Number(monthNum));
      
      let detail = '还贷明细：\n';
      const loanList = wx.getStorageSync('loanData') || [];
      
      loanList.forEach(loan => {
        // 跳过一次性贷款
        if (loan.loanType === 0) return;
        
        const amount = Number(loan.amount);
        const rate = Number(loan.rate) / 100 / 12;
        const endDate = new Date(loan.endDate);
        const startDate = new Date();
        const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (endDate.getMonth() - startDate.getMonth()) + 1;
        
        if (loan.loanType === 1) {
          const monthlyPayment = amount * rate * Math.pow(1 + rate, totalMonths) / 
                               (Math.pow(1 + rate, totalMonths) - 1);
          detail += `${loan.name}（等额本息）：${this.formatAmount(monthlyPayment)}\n`;
        } else if (loan.loanType === 2) {
          const principal = amount / totalMonths;
          const currentMonth = (Number(year) - startDate.getFullYear()) * 12 + 
                             (Number(monthNum) - 1 - startDate.getMonth());
          const remainingPrincipal = amount - (principal * currentMonth);
          const interest = remainingPrincipal * rate;
          detail += `${loan.name}（等额本金）：${this.formatAmount(principal + interest)}\n`;
        }
      });
      
      detail += `总计：${monthlyLoan}`;
      
      wx.showModal({
        title: `${month} 还贷明细`,
        content: detail,
        showCancel: false
      });
    },

    // 显示结余明细
    showBalanceDetail(e) {
      const { month, income, expense, loan, balance } = e.currentTarget.dataset;
      const detail = `结余计算：\n收入：${income}\n支出：${expense}\n还贷：${loan}\n\n结余 = 收入 - 支出 - 还贷\n= ${income} - ${expense} - ${loan}\n= ${balance}`;
      
      wx.showModal({
        title: `${month} 结余计算`,
        content: detail,
        showCancel: false
      });
    },

    // 显示总资产明细
    showAssetsDetail(e) {
      const { month, amount, balance } = e.currentTarget.dataset;
      const prevAmount = Number(amount) - Number(balance);
      const detail = `总资产计算：\n上月总资产：${prevAmount}\n本月结余：${balance}\n\n总资产 = 上月总资产 + 本月结余\n= ${prevAmount} + ${balance}\n= ${amount}`;
      
      wx.showModal({
        title: `${month} 总资产计算`,
        content: detail,
        showCancel: false
      });
    },

    // 显示剩余贷款明细
    showRemainingLoanDetail(e) {
      const { month } = e.currentTarget.dataset;
      const [year, monthNum] = month.split('-');
      const remainingLoan = this.calculateRemainingLoan(Number(year), Number(monthNum));
      
      let detail = '剩余贷款明细：\n';
      const loanList = wx.getStorageSync('loanData') || [];
      
      loanList.forEach(loan => {
        if (loan.loanType === 1 || loan.loanType === 2) {
          const amount = Number(loan.amount);
          const endDate = new Date(loan.endDate);
          const startDate = new Date();
          
          if (endDate >= new Date(year, monthNum - 1)) {
            const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                              (endDate.getMonth() - startDate.getMonth()) + 1;
            const currentMonth = (Number(year) - startDate.getFullYear()) * 12 + 
                              (Number(monthNum) - 1 - startDate.getMonth());
            
            const monthlyPrincipal = amount / totalMonths;
            const paidPrincipal = monthlyPrincipal * (currentMonth + 1);
            const remaining = amount - paidPrincipal;
            
            detail += `${loan.name}：${this.formatAmount(remaining)}\n`;
          }
        }
      });
      
      detail += `总计：${remainingLoan}`;
      
      wx.showModal({
        title: `${month} 剩余贷款明细`,
        content: detail,
        showCancel: false
      });
    },

    // 显示当前资金明细
    showCurrentFundsDetail() {
      const assets = wx.getStorageSync('assetsData') || [];
      const loans = wx.getStorageSync('loanData') || [];
      const assetsTotal = assets.reduce((sum, asset) => sum + Number(asset.amount), 0);
      const noInterestLoansTotal = loans
        .filter(loan => loan.loanType === 0)
        .reduce((sum, loan) => sum + Number(loan.amount), 0);
      
      const detail = `当前资金计算：\n总资产：${assetsTotal}\n无息贷款：${noInterestLoansTotal}\n\n当前资金 = 总资产 - 无息贷款\n= ${assetsTotal} - ${noInterestLoansTotal}\n= ${this.data.startAmount}`;
      
      wx.showModal({
        title: '当前资金明细',
        content: detail,
        showCancel: false
      });
    },

    // 显示月平均收益明细
    showMonthlyIncomeDetail() {
      const incomeList = wx.getStorageSync('incomeData') || [];
      let monthlyFixed = 0;
      let yearlyTotal = 0;
      
      incomeList.forEach(income => {
        if (income.incomeType === 1) {
          const amount = Number(income.amount);
          if (income.period === 0) {
            monthlyFixed += amount;
          } else if (income.period === 1) {
            yearlyTotal += amount;
          }
        }
      });
      
      const yearlyAverage = yearlyTotal / 12;
      const detail = `月平均收益计算：\n月固定收入：${monthlyFixed}\n年度收入平均：${this.formatAmount(yearlyAverage)} (${yearlyTotal}/12)\n\n月平均收益 = 月固定收入 + 年度收入平均\n= ${monthlyFixed} + ${this.formatAmount(yearlyAverage)}\n= ${this.data.monthlyIncome}`;
      
      wx.showModal({
        title: '月平均收益明细',
        content: detail,
        showCancel: false
      });
    },

    // 显示月平均支出明细
    showMonthlyExpenditureDetail() {
      const expenditureList = wx.getStorageSync('expenditureData') || [];
      let monthlyFixed = 0;
      let yearlyTotal = 0;
      
      expenditureList.forEach(expense => {
        if (expense.expenditureType === 1) {
          const amount = Number(expense.amount);
          if (expense.period === 0) {
            monthlyFixed += amount;
          } else if (expense.period === 1) {
            yearlyTotal += amount;
          }
        }
      });
      
      const yearlyAverage = yearlyTotal / 12;
      const detail = `月平均支出计算：\n月固定支出：${monthlyFixed}\n年度支出平均：${this.formatAmount(yearlyAverage)} (${yearlyTotal}/12)\n\n月平均支出 = 月固定支出 + 年度支出平均\n= ${monthlyFixed} + ${this.formatAmount(yearlyAverage)}\n= ${this.data.monthlyExpenditure}`;
      
      wx.showModal({
        title: '月平均支出明细',
        content: detail,
        showCancel: false
      });
    },
  }
}); 