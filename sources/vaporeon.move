module vaporeon::vaporeon {

  use sui::{
    tx_context::{sender},
    package,
    display,
    coin::Coin,
    sui::SUI,
    kiosk::{Kiosk, KioskOwnerCap},
    transfer_policy::TransferPolicy,
    clock::Clock,
    bcs,
    event::emit
  };

  use std::hash;
  use std::string::{utf8, String};

  public struct VaporeonMintEvent has copy, drop {
    id: ID,
    shiny: bool,
    kiosk_id: ID
  }

  public struct VaporeonRegistry has key, store {
    id: UID,
    minted: u64
  }

  public struct Vaporeon has key, store {
    id: UID,
    name: String,
    shiny: String,
  }

  public struct VaporeonKey has key, store {
    id: UID,
  }

  public struct VAPOREON has drop {}

  fun init(otw: VAPOREON, ctx: &mut TxContext) {
    let keys = vector[
        utf8(b"name"),
        utf8(b"link"),
        utf8(b"image_url"),
        utf8(b"description"),
        utf8(b"project_url"),
        utf8(b"creator")
    ];

    let values = vector[
        utf8(b"{name} {shiny}"),
        utf8(b"https://app.aresrpg.world"),
        utf8(b"https://assets.aresrpg.world/item/vaporeon{shiny}.png"),
        utf8(b"A commemorative pet for the old VaporeonOnSui community which got deceived by the owner. You can use it on AresRPG"),
        utf8(b"https://aresrpg.world"),
        utf8(b"VaporeonOnSui")
    ];

    let publisher = package::claim(otw, ctx);
    let mut display = display::new_with_fields<Vaporeon>(&publisher, keys, values, ctx);

    display::update_version(&mut display);

    transfer::public_transfer(publisher, sender(ctx));
    transfer::public_transfer(display, sender(ctx));

    transfer::public_share_object(VaporeonRegistry {
      id: object::new(ctx),
      minted: 0
    });

    let mut i = 500;
    while (i > 0) {
      i = i - 1;
      transfer::transfer(VaporeonKey {
        id: object::new(ctx)
      }, sender(ctx))
    };
  }

  public fun from_seed(seed: vector<u8>): u64 {
    assert!(vector::length(&seed) >= 8);
    bcs::peel_u64(&mut bcs::new(seed))
  }

  // generates seed using the tx context (epoch, sender and a newly created uid) and clock
  public fun seed_with_clock(clock: &Clock, ctx: &mut TxContext): vector<u8> {
    let mut raw_seed = raw_seed(ctx);

    let timestamp_bytes = bcs::to_bytes(&clock.timestamp_ms());
    vector::append(&mut raw_seed, timestamp_bytes);

    hash::sha3_256(raw_seed)
  }

  public fun rng_with_clock(min: u64, max: u64, clock: &Clock, ctx: &mut TxContext): u64 {
    assert!(max > min);
    let value = from_seed(seed_with_clock(clock, ctx));

    value % (max - min) + min
  }

  public fun raw_seed(ctx: &mut TxContext): vector<u8> {
    let sender = tx_context::sender(ctx);
    let sender_bytes = bcs::to_bytes(&sender);

    let epoch = tx_context::epoch(ctx);
    let epoch_bytes = bcs::to_bytes(&epoch);

    let id = object::new(ctx);
    let id_bytes = object::uid_to_bytes(&id);
    object::delete(id);

    let mut raw_seed = vector::empty<u8>();
    vector::append(&mut raw_seed, id_bytes);
    vector::append(&mut raw_seed, epoch_bytes);
    vector::append(&mut raw_seed, sender_bytes);

    raw_seed
  }

  public fun uid(self: &mut Vaporeon): &mut UID {
    &mut self.id
  }

  fun mint(
    registry: &mut VaporeonRegistry,
    kiosk: &mut Kiosk,
    cap: &KioskOwnerCap,
    policy: &TransferPolicy<Vaporeon>,
    clock: &Clock,
    ctx: &mut TxContext
  ) {
    assert!(registry.minted < 1000);

    registry.minted = registry.minted + 1;

    let shiny = if (rng_with_clock(0, 100, clock, ctx) < 5) { b"shiny" } else { b"" };

    let nft = Vaporeon {
      id: object::new(ctx),
      name: utf8(b"Vaporeon"),
      shiny: utf8(shiny)
    };

    emit(VaporeonMintEvent {
      id: nft.id.to_inner(),
      shiny: if(shiny == b"shiny") { true } else { false },
      kiosk_id: object::id(kiosk)
    });

    kiosk.lock(cap, policy, nft);
  }

  public fun mint_with_sui(
    fee: Coin<SUI>,
    registry: &mut VaporeonRegistry,
    kiosk: &mut Kiosk,
    cap: &KioskOwnerCap,
    policy: &TransferPolicy<Vaporeon>,
    clock: &Clock,
    ctx: &mut TxContext
  ) {
    assert!(fee.value() == 60 * 1000000000);

    transfer::public_transfer(fee, @treasury);

    mint(registry, kiosk, cap, policy, clock, ctx);
  }

  public fun mint_with_key(
    key: VaporeonKey,
    registry: &mut VaporeonRegistry,
    kiosk: &mut Kiosk,
    cap: &KioskOwnerCap,
    policy: &TransferPolicy<Vaporeon>,
    clock: &Clock,
    ctx: &mut TxContext
  ) {
    let VaporeonKey { id } = key;
    object::delete(id);

    mint(registry, kiosk, cap, policy, clock, ctx);
  }

  #[test]
  fun test_craft() {
    use sui::test_scenario;
    use sui::clock::{create_for_testing, destroy_for_testing};
    use std::debug;

    let sceat = @0x5EA7;
    let alice = @0xA11CE;

    let mut scenario = test_scenario::begin(sceat);
    let mut clock = create_for_testing(scenario.ctx());

    scenario.next_tx(sceat);
    {
      let rnd = rng_with_clock(0, 100, &clock, scenario.ctx());

      debug::print(&b"Random number: ");
      debug::print<u64>(&rnd);
    };

    scenario.next_tx(alice);
    {
      clock.increment_for_testing(10000);
      let rnd = rng_with_clock(0, 100, &clock, scenario.ctx());

      debug::print(&b"Random number: ");
      debug::print<u64>(&rnd);
    };

    destroy_for_testing(clock);
    scenario.end();
  }
}