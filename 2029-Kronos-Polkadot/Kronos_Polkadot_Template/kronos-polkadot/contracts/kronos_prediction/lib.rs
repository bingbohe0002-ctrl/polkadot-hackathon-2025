#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod kronos_prediction {
    use ink::storage::Mapping;

    /// 预测信息结构
    #[derive(Debug, Clone, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct PredictionInfo {
        /// 预测值
        pub predicted_value: u128,
        /// 提交时间戳
        pub timestamp: u64,
        /// 是否已结算
        pub settled: bool,
        /// 实际值（结算后填充）
        pub actual_value: Option<u128>,
    }

    /// 主合约存储
    #[ink(storage)]
    pub struct KronosPrediction {
        /// 合约所有者
        owner: AccountId,
        /// 存储预测: (用户地址, 资产符号) => 预测信息
        predictions: Mapping<(AccountId, String), PredictionInfo>,
        /// 存储实际结果: 资产符号 => 实际值
        actual_results: Mapping<String, u128>,
        /// 用户奖励余额
        rewards: Mapping<AccountId, Balance>,
        /// 总奖池
        total_pool: Balance,
    }

    /// 事件定义
    #[ink(event)]
    pub struct PredictionSubmitted {
        #[ink(topic)]
        user: AccountId,
        symbol: String,
        predicted_value: u128,
        timestamp: u64,
    }

    #[ink(event)]
    pub struct ResultUpdated {
        symbol: String,
        actual_value: u128,
        timestamp: u64,
    }

    #[ink(event)]
    pub struct RewardDistributed {
        #[ink(topic)]
        user: AccountId,
        amount: Balance,
    }

    /// 错误类型
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        /// 只有所有者可以执行
        OnlyOwner,
        /// 预测不存在
        PredictionNotFound,
        /// 预测已存在
        PredictionAlreadyExists,
        /// 余额不足
        InsufficientBalance,
        /// 无效的预测值
        InvalidPredictionValue,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    impl KronosPrediction {
        /// 构造函数
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                owner: Self::env().caller(),
                predictions: Mapping::default(),
                actual_results: Mapping::default(),
                rewards: Mapping::default(),
                total_pool: 0,
            }
        }

        /// 默认构造函数
        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new()
        }

        /// 提交预测
        #[ink(message)]
        pub fn submit_prediction(&mut self, symbol: String, predicted_value: u128) -> Result<()> {
            let caller = self.env().caller();
            let key = (caller, symbol.clone());

            // 检查是否已存在预测
            if self.predictions.contains(&key) {
                return Err(Error::PredictionAlreadyExists);
            }

            // 检查预测值是否有效
            if predicted_value == 0 {
                return Err(Error::InvalidPredictionValue);
            }

            let timestamp = self.env().block_timestamp();

            let prediction = PredictionInfo {
                predicted_value,
                timestamp,
                settled: false,
                actual_value: None,
            };

            self.predictions.insert(&key, &prediction);

            // 发出事件
            self.env().emit_event(PredictionSubmitted {
                user: caller,
                symbol,
                predicted_value,
                timestamp,
            });

            Ok(())
        }

        /// 更新实际结果（仅所有者）
        #[ink(message)]
        pub fn update_result(&mut self, symbol: String, actual_value: u128) -> Result<()> {
            if self.env().caller() != self.owner {
                return Err(Error::OnlyOwner);
            }

            let timestamp = self.env().block_timestamp();
            self.actual_results.insert(&symbol, &actual_value);

            // 发出事件
            self.env().emit_event(ResultUpdated {
                symbol,
                actual_value,
                timestamp,
            });

            Ok(())
        }

        /// 查询预测
        #[ink(message)]
        pub fn get_prediction(&self, account: AccountId, symbol: String) -> Option<PredictionInfo> {
            self.predictions.get(&(account, symbol))
        }

        /// 查询实际结果
        #[ink(message)]
        pub fn get_actual_result(&self, symbol: String) -> Option<u128> {
            self.actual_results.get(&symbol)
        }

        /// 计算并发放奖励
        #[ink(message)]
        pub fn distribute_reward(&mut self, account: AccountId, symbol: String) -> Result<()> {
            let key = (account, symbol.clone());
            
            let mut prediction = self.predictions.get(&key).ok_or(Error::PredictionNotFound)?;
            
            // 检查是否已结算
            if prediction.settled {
                return Ok(());
            }

            // 获取实际结果
            let actual_value = self.actual_results.get(&symbol).ok_or(Error::PredictionNotFound)?;

            // 计算误差百分比
            let error_percentage = if actual_value > prediction.predicted_value {
                ((actual_value - prediction.predicted_value) * 100) / actual_value
            } else {
                ((prediction.predicted_value - actual_value) * 100) / actual_value
            };

            // 根据误差计算奖励
            let reward_amount = if error_percentage <= 5 {
                1000000000000 // 1 Token (精度 12)
            } else if error_percentage <= 10 {
                500000000000  // 0.5 Token
            } else if error_percentage <= 20 {
                100000000000  // 0.1 Token
            } else {
                0
            };

            if reward_amount > 0 {
                let current_reward = self.rewards.get(&account).unwrap_or(0);
                self.rewards.insert(&account, &(current_reward + reward_amount));
                self.total_pool += reward_amount;

                // 发出事件
                self.env().emit_event(RewardDistributed {
                    user: account,
                    amount: reward_amount,
                });
            }

            // 更新预测状态
            prediction.settled = true;
            prediction.actual_value = Some(actual_value);
            self.predictions.insert(&key, &prediction);

            Ok(())
        }

        /// 查询用户奖励余额
        #[ink(message)]
        pub fn get_reward_balance(&self, account: AccountId) -> Balance {
            self.rewards.get(&account).unwrap_or(0)
        }

        /// 提取奖励
        #[ink(message)]
        pub fn withdraw_reward(&mut self) -> Result<()> {
            let caller = self.env().caller();
            let reward_amount = self.rewards.get(&caller).unwrap_or(0);

            if reward_amount == 0 {
                return Err(Error::InsufficientBalance);
            }

            // 清空余额
            self.rewards.insert(&caller, &0);

            // 转账奖励（简化版本，实际应该转账代币）
            // 这里只是记录，实际转账需要配合代币合约
            
            Ok(())
        }

        /// 获取合约所有者
        #[ink(message)]
        pub fn get_owner(&self) -> AccountId {
            self.owner
        }

        /// 获取总奖池
        #[ink(message)]
        pub fn get_total_pool(&self) -> Balance {
            self.total_pool
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn test_new_works() {
            let contract = KronosPrediction::new();
            assert_eq!(contract.get_total_pool(), 0);
        }

        #[ink::test]
        fn test_submit_prediction() {
            let mut contract = KronosPrediction::new();
            let result = contract.submit_prediction("BTC".to_string(), 50000000);
            assert!(result.is_ok());
        }

        #[ink::test]
        fn test_duplicate_prediction() {
            let mut contract = KronosPrediction::new();
            contract.submit_prediction("BTC".to_string(), 50000000).unwrap();
            let result = contract.submit_prediction("BTC".to_string(), 51000000);
            assert_eq!(result, Err(Error::PredictionAlreadyExists));
        }

        #[ink::test]
        fn test_invalid_prediction_value() {
            let mut contract = KronosPrediction::new();
            let result = contract.submit_prediction("BTC".to_string(), 0);
            assert_eq!(result, Err(Error::InvalidPredictionValue));
        }
    }
}

