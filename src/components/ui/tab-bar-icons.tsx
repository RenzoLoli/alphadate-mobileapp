import * as React from "react";

import { View } from "react-native";

export type IconParts = {
  stroke: string;
  fill: string;
};

type TabIconProps = {
  parts: IconParts;
};

function HomeIcon({ parts }: TabIconProps) {
  return (
    <View className="relative h-6 w-6">
      <View
        className={`absolute left-[4px] top-[8px] h-[2px] w-[12px] rounded-full ${parts.fill}`}
        style={{ transform: [{ rotate: "-45deg" }] }}
      />
      <View
        className={`absolute right-[4px] top-[8px] h-[2px] w-[12px] rounded-full ${parts.fill}`}
        style={{ transform: [{ rotate: "45deg" }] }}
      />
      <View
        className={`absolute left-[6px] top-[11px] h-[9px] w-[12px] rounded-[2px] border-[1.8px] ${parts.stroke}`}
      />
      <View
        className={`absolute left-[10px] top-[15px] h-[5px] w-[4px] rounded-b-[1px] ${parts.fill}`}
      />
    </View>
  );
}

const SLIDER_ROWS = [
  { trackTop: "top-[5px]", knobLeft: "left-[5px]", knobTop: "top-[3px]" },
  { trackTop: "top-[11px]", knobLeft: "left-[9.5px]", knobTop: "top-[10px]" },
  { trackTop: "top-[17px]", knobLeft: "left-[14px]", knobTop: "top-[15px]" },
];

function SettingsIcon({ parts }: TabIconProps) {
  return (
    <View className="relative h-6 w-6">
      {SLIDER_ROWS.map((row, index) => (
        <React.Fragment key={index}>
          <View
            className={`absolute left-[6px] ${row.trackTop} h-[2px] w-[12px] rounded-full opacity-40 ${parts.fill}`}
          />
          <View
            className={`absolute ${row.knobLeft} ${row.knobTop} h-[5px] w-[5px] rounded-full ${parts.fill}`}
          />
        </React.Fragment>
      ))}
    </View>
  );
}

function DotIcon({ parts }: TabIconProps) {
  return (
    <View className="relative flex h-6 w-6 items-center justify-center">
      <View className={`h-[6px] w-[6px] rounded-full ${parts.fill}`} />
    </View>
  );
}

export type TabIcon = (props: TabIconProps) => React.ReactNode;

export { DotIcon, HomeIcon, SettingsIcon };
