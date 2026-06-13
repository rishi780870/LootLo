import { db } from "./firebase";

import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export const startGameEngine =
  () => {

    setInterval(
      async () => {

        try {

          const gameRef =
            doc(
              db,
              "gameState",
              "current"
            );

          const snap =
            await getDoc(
              gameRef
            );

          if (
            !snap.exists()
          )
            return;

          const data =
            snap.data();

          const elapsed =
            Math.floor(
              (Date.now() -
                data.startTime) /
                1000
            );

          if (
            elapsed < 30
          )
            return;

          const result =
            Math.floor(
              Math.random() *
                10
            );

          await updateDoc(
            gameRef,
            {
              result:
                result,

              period:
                Number(
                  data.period
                ) + 1,

              startTime:
                Date.now(),
            }
          );

          console.log(
            "New Result:",
            result
          );

        } catch (
          err
        ) {
          console.log(
            err
          );
        }

      },
      1000
    );
  };