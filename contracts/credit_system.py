from algopy import (
    ARC4Contract,
    GlobalState,
    LocalState,
    Txn,
    gtxn,
    Global,
    itxn,
    UInt64,
    Account,
    String,
    arc4,
    gtxn as GroupTransaction,
)


class CreditSystem(ARC4Contract):
    """
    AgentWallet Credit System Smart Contract
    
    Users buy credits with ALGO, credits stored on-chain.
    Backend deducts credits when users consume agent services.
    Company holds USDC and pays agents via x402.
    """
    
    def __init__(self) -> None:
        # Global state
        self.admin = GlobalState(Account)
        self.company_wallet = GlobalState(Account)
        self.algo_to_credit_rate = GlobalState(UInt64)  # Credits per ALGO
        self.total_credits_issued = GlobalState(UInt64)
        
        # Local state (per user)
        self.user_credits = LocalState(UInt64)
    
    @arc4.abimethod(allow_actions=["NoOp"], create="require")
    def create(self) -> None:
        """Initialize the contract"""
        self.admin.value = Txn.sender
        self.company_wallet.value = Txn.sender
        self.algo_to_credit_rate.value = UInt64(100)  # Default: 100 credits per ALGO
        self.total_credits_issued.value = UInt64(0)
    
    @arc4.abimethod(allow_actions=["OptIn"])
    def opt_in(self) -> None:
        """User opts into the contract to hold credits"""
        self.user_credits[Txn.sender] = UInt64(0)
    
    @arc4.abimethod
    def buy_credits(self, payment: gtxn.PaymentTransaction) -> arc4.UInt64:
        """
        Buy credits with ALGO
        User sends payment transaction, receives credits
        
        Args:
            payment: Payment transaction sending ALGO to company wallet
            
        Returns:
            Number of credits added
        """
        # Verify payment transaction
        assert payment.receiver == self.company_wallet.value, "Payment must go to company wallet"
        assert payment.sender == Txn.sender, "Payment sender must match caller"
        
        # Calculate credits based on ALGO amount
        # payment.amount is in microALGO, convert to ALGO first
        algo_amount = payment.amount // UInt64(1_000_000)
        credits_to_add = algo_amount * self.algo_to_credit_rate.value
        
        # Update user's credit balance
        current_credits = self.user_credits[Txn.sender]
        self.user_credits[Txn.sender] = current_credits + credits_to_add
        
        # Update total credits issued
        self.total_credits_issued.value = self.total_credits_issued.value + credits_to_add
        
        return arc4.UInt64(credits_to_add)
    
    @arc4.abimethod
    def deduct_credits(self, user: Account, amount: UInt64) -> None:
        """
        Deduct credits from user (admin only)
        Called by backend when user consumes services
        
        Args:
            user: User address to deduct from
            amount: Number of credits to deduct
        """
        # Only admin can deduct credits
        assert Txn.sender == self.admin.value, "Only admin can deduct credits"
        
        # Get current balance
        current_credits = self.user_credits[user]
        
        # Verify sufficient balance
        assert current_credits >= amount, "Insufficient credits"
        
        # Deduct credits
        self.user_credits[user] = current_credits - amount
    
    @arc4.abimethod(readonly=True)
    def get_balance(self, user: Account) -> arc4.UInt64:
        """
        Get credit balance for a user
        
        Args:
            user: User address to check
            
        Returns:
            Credit balance
        """
        return arc4.UInt64(self.user_credits[user])
    
    @arc4.abimethod(readonly=True)
    def get_my_balance(self) -> arc4.UInt64:
        """
        Get credit balance for caller
        
        Returns:
            Caller's credit balance
        """
        return arc4.UInt64(self.user_credits[Txn.sender])
    
    @arc4.abimethod
    def set_rate(self, new_rate: UInt64) -> None:
        """
        Set ALGO to credit conversion rate (admin only)
        
        Args:
            new_rate: New conversion rate (credits per ALGO)
        """
        assert Txn.sender == self.admin.value, "Only admin can set rate"
        assert new_rate > UInt64(0), "Rate must be positive"
        
        self.algo_to_credit_rate.value = new_rate
    
    @arc4.abimethod(readonly=True)
    def get_rate(self) -> arc4.UInt64:
        """
        Get current ALGO to credit conversion rate
        
        Returns:
            Credits per ALGO
        """
        return arc4.UInt64(self.algo_to_credit_rate.value)
    
    @arc4.abimethod(readonly=True)
    def get_total_issued(self) -> arc4.UInt64:
        """
        Get total credits issued across all users
        
        Returns:
            Total credits issued
        """
        return arc4.UInt64(self.total_credits_issued.value)
    
    @arc4.abimethod
    def withdraw_algo(self, receiver: Account, amount: UInt64) -> None:
        """
        Withdraw ALGO from contract (admin only)
        
        Args:
            receiver: Address to receive ALGO
            amount: Amount in microALGO
        """
        assert Txn.sender == self.admin.value, "Only admin can withdraw"
        
        # Send ALGO from contract to receiver
        itxn.Payment(
            receiver=receiver,
            amount=amount,
            fee=UInt64(0),  # Caller pays fee
        ).submit()
    
    @arc4.abimethod
    def update_admin(self, new_admin: Account) -> None:
        """
        Transfer admin rights (admin only)
        
        Args:
            new_admin: New admin address
        """
        assert Txn.sender == self.admin.value, "Only admin can update admin"
        self.admin.value = new_admin
    
    @arc4.abimethod
    def update_company_wallet(self, new_wallet: Account) -> None:
        """
        Update company wallet address (admin only)
        
        Args:
            new_wallet: New company wallet address
        """
        assert Txn.sender == self.admin.value, "Only admin can update wallet"
        self.company_wallet.value = new_wallet
    
    @arc4.abimethod(readonly=True)
    def get_admin(self) -> Account:
        """Get admin address"""
        return self.admin.value
    
    @arc4.abimethod(readonly=True)
    def get_company_wallet(self) -> Account:
        """Get company wallet address"""
        return self.company_wallet.value
