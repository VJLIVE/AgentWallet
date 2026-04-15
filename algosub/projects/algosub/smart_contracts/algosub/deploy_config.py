import logging

import algokit_utils

logger = logging.getLogger(__name__)


# define deployment behaviour based on supplied app spec
def deploy() -> None:
    from smart_contracts.artifacts.algosub.algo_sub_client import (
        AlgoSubFactory,
    )

    # Get Algorand client configured for the environment (TestNet/MainNet/LocalNet)
    algorand = algokit_utils.AlgorandClient.from_environment()
    
    # Get deployer account from environment variable
    deployer = algorand.account.from_environment("DEPLOYER")

    logger.info(f"Deploying AlgoSub contract from account: {deployer.address}")

    # Create typed app factory
    factory = algorand.client.get_typed_app_factory(
        AlgoSubFactory, default_sender=deployer.address
    )

    # Deploy the contract
    app_client, result = factory.deploy(
        on_update=algokit_utils.OnUpdate.AppendApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
    )

    logger.info(
        f"✅ AlgoSub deployed successfully!\n"
        f"   App ID: {app_client.app_id}\n"
        f"   App Address: {app_client.app_address}\n"
        f"   Operation: {result.operation_performed}"
    )

    # Fund the app account with 1 ALGO for minimum balance
    if result.operation_performed in [
        algokit_utils.OperationPerformed.Create,
        algokit_utils.OperationPerformed.Replace,
    ]:
        logger.info("Funding app account with 1 ALGO...")
        algorand.send.payment(
            algokit_utils.PaymentParams(
                amount=algokit_utils.AlgoAmount(algo=1),
                sender=deployer.address,
                receiver=app_client.app_address,
            )
        )
        logger.info("✅ App account funded")

    logger.info(
        f"\n🎉 Deployment complete!\n"
        f"   Contract: AlgoSub\n"
        f"   App ID: {app_client.app_id}\n"
        f"   Network: {algorand.client.algod.algod_address}\n"
        f"\n📝 Next steps:\n"
        f"   1. Users need to opt-in: app_client.send.opt_in()\n"
        f"   2. Set rules: app_client.send.set_rule(vendor='Swiggy', max_amount=300000000)\n"
        f"   3. Validate payments: app_client.send.validate_payment()\n"
    )

