import { useEffect, useLayoutEffect, useMemo } from "preact/hooks";
import { Animation, translateY } from "./animation/animation.jsx";
import appStyleSheet from "./app.css" with { type: "css" };
import { MountainAndSkyBattleBackground } from "./battle_background/battle_backgrounds.jsx";
import { Benjamin } from "./character/benjamin.jsx";
import "./custom_elements_redefine.js";
import { FirstEnemy } from "./enemy/enemies.jsx";
import { SwordA } from "./fight/sword_a.jsx";
import { swordASoundUrl } from "./fight/sword_sound_url.js";
import { WhiteCurtain } from "./fight/white_curtain.jsx";
import { useBooleanState } from "./hooks/use_boolean_state.js";
import { useSound } from "./hooks/use_sound.js";
import { Box } from "./layout/box.jsx";

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

  const [moveToAttack, startMovingToAttack, stopMovingToAttack] =
    useBooleanState();
  const [attack, startAttacking, stopAttacking] = useBooleanState();
  const [
    moveBackAfterAttack,
    startMovingBackAfterAttack,
    stopMovingBackAfterAttack,
  ] = useBooleanState();

  const swordSound = useSound({ url: swordASoundUrl });
  const [whiteCurtain, showWhiteCurtain, hideWhiteCurtain] = useBooleanState();

  // TODO: instead of this split all options into their own property so they stay the same?
  // but callback will still change.../[-]
  const attackAnimationOptions = useMemo(
    () => ({
      steps: [
        {
          transform: `scaleX(-1) translateX(20px) rotate(10deg)`,
        },
        {
          transform: `scaleX(-1) translateX(0px) rotate(-10deg)`,
        },
      ],
      duration: 200,
      onStart: () => {
        showWhiteCurtain();

        swordSound.currentTime = 0.15;
        swordSound.play();
      },
      onFinish: () => {
        // swordSound.pause();
        stopAttacking();
        startMovingBackAfterAttack();
      },
    }),
    [attack],
  );
  const moveToAttackAnimationOptions = useMemo(
    () => ({
      ...translateY(-20),
      duration: 200,
      onCancel: () => {
        stopMovingToAttack();
      },
      onFinish: () => {
        stopMovingToAttack();
        startAttacking();
      },
    }),
    [moveToAttack],
  );
  const moveBackAfterAttackAnimationOptions = useMemo(
    () => ({
      ...translateY(0),
      duration: 200,
      onCancel: () => {
        stopMovingBackAfterAttack();
      },
      onFinish: () => {
        stopMovingBackAfterAttack();
      },
    }),
    [moveBackAfterAttack],
  );
  useEffect(() => {
    const timeout = setTimeout(hideWhiteCurtain, 150);
    return () => {
      clearTimeout(timeout);
    };
  }, [whiteCurtain]);

  return (
    <div
      className="app"
      style={{ position: "relative", height: "200px", width: "300px" }}
      onClick={() => {
        if (!attack && !moveBackAfterAttack) {
          startMovingToAttack();
        }
      }}
    >
      <div
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <MountainAndSkyBattleBackground />
        {whiteCurtain && (
          <WhiteCurtain style={{ position: "absolute", left: 0, top: 0 }} />
        )}
      </div>
      <div
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <Box height={100} width={100} x="center" y={26}>
          <FirstEnemy />
          {attack && (
            <Animation options={attackAnimationOptions}>
              <Box width={60} height={60}>
                <SwordA />
              </Box>
            </Animation>
          )}
        </Box>
        <Animation
          options={
            moveToAttack
              ? moveToAttackAnimationOptions
              : moveBackAfterAttack
                ? moveBackAfterAttackAnimationOptions
                : null
          }
        >
          <Box width={25} height={25} x="center" y={140}>
            <Benjamin direction="top" activity="walking" />
          </Box>
        </Animation>
      </div>
    </div>
  );
};
