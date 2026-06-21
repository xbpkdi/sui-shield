#[test_only]
module starter_badge::starter_badge_tests {
    use sui::test_scenario::{Self, Scenario};
    use starter_badge::starter_badge::{Self, BadgeRegistry, StarterBadge};

    // Hex-safe test addresses
    const ALICE: address = @0xA11CE;
    const BOB:   address = @0xB0B;
    const ADMIN: address = @0xCAFE;

    fun setup(scenario: &mut Scenario) {
        test_scenario::next_tx(scenario, ADMIN);
        {
            starter_badge::init_for_testing(test_scenario::ctx(scenario));
        };
    }

    #[test]
    fun test_mint_once() {
        let mut scenario = test_scenario::begin(ALICE);
        setup(&mut scenario);

        test_scenario::next_tx(&mut scenario, ALICE);
        {
            let mut registry = test_scenario::take_shared<BadgeRegistry>(&scenario);
            starter_badge::mint_badge(&mut registry, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(registry);
        };

        test_scenario::next_tx(&mut scenario, ALICE);
        {
            let badge = test_scenario::take_from_sender<StarterBadge>(&scenario);
            test_scenario::return_to_sender(&scenario, badge);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 7)]
    fun test_mint_twice_aborts() {
        let mut scenario = test_scenario::begin(BOB);
        setup(&mut scenario);

        test_scenario::next_tx(&mut scenario, BOB);
        {
            let mut registry = test_scenario::take_shared<BadgeRegistry>(&scenario);
            starter_badge::mint_badge(&mut registry, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(registry);
        };

        test_scenario::next_tx(&mut scenario, BOB);
        {
            let mut registry = test_scenario::take_shared<BadgeRegistry>(&scenario);
            // Second mint must abort with EBadgeAlreadyMinted = 7
            starter_badge::mint_badge(&mut registry, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(registry);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_different_wallets_can_each_mint_once() {
        let mut scenario = test_scenario::begin(ALICE);
        setup(&mut scenario);

        test_scenario::next_tx(&mut scenario, ALICE);
        {
            let mut registry = test_scenario::take_shared<BadgeRegistry>(&scenario);
            starter_badge::mint_badge(&mut registry, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(registry);
        };

        test_scenario::next_tx(&mut scenario, BOB);
        {
            let mut registry = test_scenario::take_shared<BadgeRegistry>(&scenario);
            starter_badge::mint_badge(&mut registry, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(registry);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_has_badge_after_mint() {
        let mut scenario = test_scenario::begin(ALICE);
        setup(&mut scenario);

        test_scenario::next_tx(&mut scenario, ALICE);
        {
            let mut registry = test_scenario::take_shared<BadgeRegistry>(&scenario);
            assert!(!starter_badge::has_badge(&registry, ALICE), 0);
            starter_badge::mint_badge(&mut registry, test_scenario::ctx(&mut scenario));
            assert!(starter_badge::has_badge(&registry, ALICE), 1);
            test_scenario::return_shared(registry);
        };

        test_scenario::end(scenario);
    }
}
