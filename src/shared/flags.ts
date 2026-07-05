// Bit values from iRacing's irsdk_defines.h (public SDK header) SessionFlags bitmask.
const IRSDK_CHECKERED = 0x00000001;
const IRSDK_WHITE = 0x00000002;
const IRSDK_GREEN = 0x00000004;
const IRSDK_YELLOW = 0x00000008;
const IRSDK_RED = 0x00000010;
const IRSDK_YELLOW_WAVING = 0x00000100;
const IRSDK_CAUTION = 0x00004000;
const IRSDK_CAUTION_WAVING = 0x00008000;

export type RaceFlag = "green" | "yellow" | "red" | "white" | "checkered";

export function decodeSessionFlags(bitmask: number | null | undefined): RaceFlag {
  if (!bitmask) return "green";
  if (bitmask & IRSDK_CHECKERED) return "checkered";
  if (bitmask & IRSDK_RED) return "red";
  if (bitmask & (IRSDK_YELLOW | IRSDK_YELLOW_WAVING | IRSDK_CAUTION | IRSDK_CAUTION_WAVING)) return "yellow";
  if (bitmask & IRSDK_WHITE) return "white";
  if (bitmask & IRSDK_GREEN) return "green";
  return "green";
}
