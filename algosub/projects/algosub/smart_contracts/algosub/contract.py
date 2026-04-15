from algopy import ARC4Contract, String, UInt64, gtxn, Txn, Global, TransactionType, LocalState, arc4


class AlgoSub(ARC4Contract):
    """
    AlgoSub Smart Contract
    Allows users to set spending rules and validate payments against those rules
    """

    def __init__(self) -> None:
        # Store admin on creation
        self.admin = Txn.sender
        # Initialize local state
        self.vendor = LocalState(String, key="vendor")
        self.max_amount = LocalState(UInt64, key="max_amount")

    @arc4.abimethod(allow_actions=["OptIn"])
    def opt_in(self) -> None:
        """User opts in to store their own rules"""
        # Initialize user's local state with empty values
        # Local state will be set when user calls set_rule
        pass

    @arc4.abimethod
    def set_rule(self, vendor: String, max_amount: UInt64) -> None:
        """
        Set spending rule for the caller
        Args:
            vendor: Vendor name (e.g., "Swiggy")
            max_amount: Maximum allowed amount in microAlgos
        """
        # Store rule in caller's local state
        self.vendor[Txn.sender] = vendor
        self.max_amount[Txn.sender] = max_amount

    @arc4.abimethod
    def validate_payment(self) -> String:
        """
        Validate a payment transaction against stored rules
        Must be called in a group transaction where:
        - Index 0: App call (this transaction)
        - Index 1: Payment transaction
        """
        # Ensure this is a grouped transaction with 2 txns
        assert Global.group_size == 2, "Must be grouped with payment"

        # Get the payment transaction (index 1)
        payment_txn = gtxn.PaymentTransaction(1)

        # Verify it's a payment transaction
        assert payment_txn.type == TransactionType.Payment, "Second txn must be payment"

        # Verify sender matches
        assert payment_txn.sender == Txn.sender, "Payment sender must match caller"

        # Get user's max amount rule
        user_max_amount = self.max_amount[Txn.sender]

        # Validate amount
        assert payment_txn.amount <= user_max_amount, "Payment exceeds max amount"

        return String("Payment validated successfully")
