import { computed, signal } from "@preact/signals";
import { forwardRef } from "preact/compat";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";
import { useCanvasGlowAnimation } from "./animations/use_canvas_glow_animation.js";
import { useDigitsDisplayAnimation } from "./animations/use_digits_display_animation.js";
import { useElementAnimation } from "./animations/use_element_animation.js";
import { usePartyMemberHitAnimation } from "./animations/use_party_member_hit_animation.js";
import appStyleSheet from "./app.css" with { type: "css" };
import { MountainAndSkyBattleBackground } from "./battle_background/battle_backgrounds.jsx";
import { Benjamin } from "./character/benjamin.jsx";
import { Lifebar } from "./components/lifebar/lifebar.jsx";
import { Message } from "./components/message/message.jsx";
import { Enemy } from "./enemy/enemy.jsx";
import { taurus } from "./enemy/taurus.js";
import { MenuFight } from "./fight/menu_fight.jsx";
import { Selector } from "./fight/selector.jsx";
import { SwordA, SwordAIcon } from "./fight/sword_a.jsx";
import { swordASoundUrl } from "./fight/sword_sound_url.js";
import { WhiteCurtain } from "./fight/white_curtain.jsx";
import { useBooleanState } from "./hooks/use_boolean_state.js";
import { useKeyEffect } from "./hooks/use_key_effect.js";
import { useSound } from "./hooks/use_sound.js";
import { PauseDialog } from "./interface/pause_dialog.jsx";
import { Box } from "./layout/box.jsx";
import { pause, pausedSignal, play } from "./signals.js";
import { Digits } from "./text/digits.jsx";

// const enemiesSignal = signal([taurus]);
const enemySignal = signal(taurus);
const enemyImageUrlSignal = computed(() => enemySignal.value.url);
const enemyImageTransparentColorSignal = computed(
  () => enemySignal.value.transparentColor,
);
const enemyNameSignal = computed(() => enemySignal.value.name);
const enemyHpMaxSignal = computed(() => enemySignal.value.hp);
const enmyStatesSignal = computed(() => enemySignal.value.states);

export const App = () => {
  useLayoutEffect(() => {
    document.adoptedStyleSheets = [
      ...document.adoptedStyleSheets,
      appStyleSheet,
    ];
    return () => {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (s) => s !== appStyleSheet,
      );
    };
  }, []);
  const enemyHpMax = enemyHpMaxSignal.value;
  const enemyStates = enmyStatesSignal.value;
  const oponentRef = useRef();
  const [enemyHp, enemyHpSetter] = useState(enemyHpMax);
  const decreaseEnemyHp = useCallback((value) => {
    enemyHpSetter((hp) => hp - value);
  }, []);
  const heroRef = useRef();

  const [heroHp, heroHpSetter] = useState(40);
  const decreaseHeroHp = useCallback((value) => {
    heroHpSetter((hp) => hp - value);
  }, []);
  const [heroMaxHp] = useState(40);

  const swordSound = useSound({ url: swordASoundUrl, volume: 0.25 });
  const [whiteCurtain, showWhiteCurtain, hideWhiteCurtain] = useBooleanState();
  useEffect(() => {
    const timeout = setTimeout(hideWhiteCurtain, 150);
    return () => {
      clearTimeout(timeout);
    };
  }, [whiteCurtain]);

  const [isSelectingTarget, isSelectingTargetSetter] = useState(false);

  useKeyEffect({
    Escape: useCallback(() => {
      if (isSelectingTarget) {
        isSelectingTargetSetter(false);
      }
    }, [isSelectingTarget]),
  });

  const turnStateRef = useRef("idle");
  const startTurn = async () => {
    turnStateRef.current = "running";
    // here we could display a message saying what attack hero performs
    await heroRef.current.playHeroMoveToAct();
    showWhiteCurtain();
    swordSound.currentTime = 0.15;
    swordSound.play();
    await oponentRef.current.playWeaponTranslation();
    const moveBackToPositionPromise =
      heroRef.current.playPartyMemberMoveBackToPosition();
    await new Promise((resolve) => setTimeout(resolve, 200));
    await Promise.all([
      oponentRef.current.playEnemyDamage(25),
      moveBackToPositionPromise,
    ]);
    decreaseEnemyHp(25);
    // here we could display a message saying what attack enemy performs
    await new Promise((resolve) => setTimeout(resolve, 150));
    await oponentRef.current.playEnemyGlow();
    await heroRef.current.playPartyMemberHit();
    await new Promise((resolve) => setTimeout(resolve, 150));
    await heroRef.current.playPartyMemberDamage(15);
    decreaseHeroHp(15);
    turnStateRef.current = "idle";
  };

  return (
    <div style="font-size: 16px;">
      <Box vertical name="screen" width="400" height="400">
        <Box vertical name="game" width="100%" height="...">
          <Box name="background" absolute width="100%" height="100%">
            <MountainAndSkyBattleBackground />
            <WhiteCurtain visible={whiteCurtain} />
          </Box>
          <Box name="enemies_box" width="100%" height="55%">
            <Opponent
              ref={oponentRef}
              isSelectingTarget={isSelectingTarget}
              enemyHp={enemyHp}
              enemyHpMax={enemyHpMax}
              enemyStates={enemyStates}
              onSelect={() => {
                isSelectingTargetSetter(false);
                startTurn();
              }}
            />
          </Box>
          <Box name="front_line" width="100%" height="10%"></Box>
          <Box name="allies_box" height="10%" width="100%">
            <Ally ref={heroRef} />
          </Box>
          <Box
            name="bottom_ui"
            width="100%"
            height="..."
            contentX="center"
            contentY="end"
            innerSpacingBottom="0.5em"
            hidden={isSelectingTarget}
          >
            <MenuFight
              onAttack={() => {
                if (turnStateRef.current === "idle" && !pausedSignal.value) {
                  isSelectingTargetSetter(true);
                }
              }}
            ></MenuFight>
          </Box>
        </Box>
        <Box
          name="bottom_hud"
          width="100%"
          height="15%"
          maxHeight="50"
          y="end"
          innerSpacing="xss"
          style={{
            background: "black",
          }}
        >
          <Box
            name="hero_hud"
            width="50%"
            height="100%"
            maxHeight="100%"
            innerSpacing="s"
            style={{
              border: "2px solid white",
            }}
          >
            <Box name="lifebar_box" ratio="120/100" width="80%" y="center">
              <Lifebar value={heroHp} max={heroMaxHp} />
            </Box>
            <Box name="weapon_box" ratio="1/1" width="20%" x="end" y="center">
              <SwordAIcon />
            </Box>
          </Box>
          <Box
            name="ally_hud"
            width="50%"
            height="100%"
            style={{
              border: "2px solid white",
            }}
          >
            Empty
          </Box>
        </Box>
        <PauseDialog visible={pausedSignal.value} />
      </Box>
      <div>
        <button
          onClick={() => {
            if (pausedSignal.value) {
              play();
            } else {
              pause();
            }
          }}
        >
          {pausedSignal.value ? "play" : "pause"}
        </button>
      </div>
    </div>
  );
};

const Ally = forwardRef((props, ref) => {
  const elementRef = useRef();
  const [heroDamage, heroDamageSetter] = useState(null);

  const [playHeroMoveToAct] = useElementAnimation({
    id: "hero_move_to_act",
    elementRef,
    to: {
      y: -20,
    },
    duration: 200,
  });
  const [playPartyMemberMoveBackToPosition] = useElementAnimation({
    id: "party_member_move_back_to_position",
    elementRef,
    to: {
      y: 0,
    },
    duration: 200,
  });

  const heroDigitsElementRef = useRef();
  const [playPartyMemberHit] = usePartyMemberHitAnimation({
    elementRef,
    duration: 500,
  });
  const [playPartyMemberDamage] = useDigitsDisplayAnimation({
    elementRef: heroDigitsElementRef,
    duration: 300,
    toY: -1.2,
  });

  useImperativeHandle(ref, () => {
    return {
      playHeroMoveToAct,
      playPartyMemberMoveBackToPosition,
      playPartyMemberHit,
      playPartyMemberDamage: async (value) => {
        heroDamageSetter(value);
        await playPartyMemberDamage();
        heroDamageSetter(null);
      },
    };
  });

  return (
    <Box name="ally_box" ratio="1/1" height="100%" x="center">
      <Benjamin elementRef={elementRef} direction="top" activity="walking" />
      <Box
        name="hero_digits_box"
        absolute
        elementRef={heroDigitsElementRef}
        hidden={heroDamage === null}
        width="100%"
        height="100%"
      >
        <Box x="center" y="end">
          <Digits
            name="hero_digits"
            dx={2} // for some reason it's better centered with that
          >
            {heroDamage}
          </Digits>
        </Box>
      </Box>
    </Box>
  );
});

const Opponent = forwardRef(
  (
    {
      // name,
      isSelectingTarget,
      enemyHp,
      enemyHpMax,
      enemyStates,
      onSelect,
    },
    ref,
  ) => {
    const elementRef = useRef();
    const [playEnemyGlow] = useCanvasGlowAnimation({
      id: "enemy_glow",
      elementRef,
      from: "black",
      to: "white",
      duration: 300,
    });

    const enemyDigitsElementRef = useRef();
    const [playEnemyDamage] = useDigitsDisplayAnimation({
      elementRef: enemyDigitsElementRef,
      duration: 300,
    });
    const weaponElementRef = useRef();
    const [playWeaponTranslation] = useElementAnimation({
      id: "weapon_translation",
      elementRef: weaponElementRef,
      from: {
        x: 25,
      },
      to: {
        x: -15,
      },
      duration: 200,
    });
    const [weaponIsVisible, weaponIsVisibleSetter] = useState(false);

    const enemyStateKey = enemyStates
      ? Object.keys(enemyStates).find((key) => {
          const { conditions } = enemyStates[key];
          if (
            conditions.hp &&
            conditions.hp({ hp: enemyHp, hpMax: enemyHpMax })
          ) {
            return true;
          }
          return false;
        })
      : null;
    const enemyPropsFromState = enemyStateKey ? enemyStates[enemyStateKey] : {};
    const enemyImageUrl = enemyImageUrlSignal.value;
    const enemyImageTransparentColor = enemyImageTransparentColorSignal.value;

    const [enemyDamage, enemyDamageSetter] = useState(null);

    useImperativeHandle(ref, () => {
      return {
        playEnemyGlow,
        playWeaponTranslation: async () => {
          weaponIsVisibleSetter(true);
          await playWeaponTranslation();
          weaponIsVisibleSetter(false);
        },
        playEnemyDamage: async (value) => {
          enemyDamageSetter(value);
          await playEnemyDamage();
          enemyDamageSetter(null);
        },
      };
    });

    return (
      <Box
        vertical
        name="enemy_container_box"
        width="100%"
        height="100%"
        x="center"
      >
        <Box name="top_ui" width="100%" innerSpacing="0.5em">
          <Message hidden={isSelectingTarget} innerSpacing="0.7em">
            {enemyNameSignal.value}
          </Message>
        </Box>
        <Box
          name="enemy_box"
          ratio="1/1"
          height="..."
          x="center"
          innerSpacing="10"
        >
          <Selector
            hidden={!isSelectingTarget}
            onClick={() => {
              onSelect();
            }}
          />
          <Enemy
            elementRef={elementRef}
            url={enemyPropsFromState.url || enemyImageUrl}
            transparentColor={enemyImageTransparentColor}
            x={enemyPropsFromState.x}
            y={enemyPropsFromState.y}
          />
          <Box
            name="weapon_box"
            absolute
            hidden={!weaponIsVisible}
            ratio="1/1"
            height="50%"
            x="center"
            y="center"
          >
            <SwordA elementRef={weaponElementRef} />
          </Box>
          <Box
            name="enemy_digits_box"
            absolute
            elementRef={enemyDigitsElementRef}
            hidden={enemyDamage === null}
            width="100%"
            height="100%"
          >
            <Box x="center" y="center">
              <Digits name="enemy_digits">{enemyDamage}</Digits>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  },
);
