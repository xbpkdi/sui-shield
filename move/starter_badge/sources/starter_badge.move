/// Starter Badge — one badge per wallet, enforced on-chain via a shared registry.
/// Abort code 7 (EBadgeAlreadyMinted) is raised when a wallet tries to mint twice.
/// The registry is created once at package deployment and shared globally.
module starter_badge::starter_badge {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::event;

    const EBadgeAlreadyMinted: u64 = 7;

    public struct StarterBadge has key, store {
        id: UID,
        recipient: address,
        minted_at_epoch: u64,
    }

    /// Shared registry that maps wallet address → badge ID.
    /// One shared object per deployment; passed by mutable reference to mint_badge.
    public struct BadgeRegistry has key {
        id: UID,
        minted: Table<address, ID>,
    }

    public struct BadgeMinted has copy, drop {
        badge_id: ID,
        recipient: address,
        epoch: u64,
    }

    fun init(ctx: &mut TxContext) {
        transfer::share_object(BadgeRegistry {
            id: object::new(ctx),
            minted: table::new(ctx),
        });
    }

    /// Gasless entry point: sponsor pays gas, user receives badge.
    /// Aborts with EBadgeAlreadyMinted (7) if the sender has already claimed.
    #[allow(lint(self_transfer))]
    public fun mint_badge(
        registry: &mut BadgeRegistry,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(!table::contains(&registry.minted, sender), EBadgeAlreadyMinted);

        let badge = StarterBadge {
            id: object::new(ctx),
            recipient: sender,
            minted_at_epoch: tx_context::epoch(ctx),
        };

        let badge_id = object::id(&badge);
        table::add(&mut registry.minted, sender, badge_id);

        event::emit(BadgeMinted {
            badge_id,
            recipient: sender,
            epoch: tx_context::epoch(ctx),
        });

        transfer::transfer(badge, sender);
    }

    public fun has_badge(registry: &BadgeRegistry, wallet: address): bool {
        table::contains(&registry.minted, wallet)
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
