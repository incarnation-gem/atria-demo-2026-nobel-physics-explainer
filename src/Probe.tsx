/** 共享层图元探针（验收用，非成片内容）：一帧渲染全部本片新增图元，配标签。 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Svg, CText, BlackHoleJet, NeutrinoDot, DOMSphere, CherenkovCone, EnvelopeIcon, EarthIcon, GalaxyIcon, MedalIcon, MuonArrow, AtomNucleus, GREY} from './ui';

export const Probe: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#0b0c11'}}>
    <Svg>
      <BlackHoleJet cx={150} cy={185} size={90} jetL={72} glowK={1} />
      <NeutrinoDot x={335} y={185} dir={-0.18} tail={52} dotR={8} />
      <MuonArrow x0={395} y0={205} x1={545} y1={150} p={1} />
      <AtomNucleus cx={650} cy={170} r={38} />
      {[0, 1, 2, 3, 4].map((i) => (
        <DOMSphere key={i} cx={150 + i * 46} cy={330} r={17} lit={1} stemH={22} />
      ))}
      <DOMSphere cx={430} cy={330} r={17} lit={0} stemH={22} />
      <CherenkovCone apexX={140} apexY={510} dir={0.32} len={330} p={1} />
      <EarthIcon cx={660} cy={480} r={95} />
      <GalaxyIcon cx={920} cy={470} r={120} />
      <MedalIcon cx={1130} cy={460} r={68} />
    </Svg>
    <EnvelopeIcon x={1020} y={520} w={200} h={140} openK={1} />
    <CText cx={150} cy={105} size={22} weight={600} color={GREY}>BlackHoleJet</CText>
    <CText cx={330} cy={105} size={22} weight={600} color={GREY}>NeutrinoDot</CText>
    <CText cx={470} cy={105} size={22} weight={600} color={GREY}>MuonArrow</CText>
    <CText cx={650} cy={105} size={22} weight={600} color={GREY}>AtomNucleus</CText>
    <CText cx={330} cy={400} size={22} weight={600} color={GREY}>DOMSphere ×6（lit×5 + unlit×1）</CText>
    <CText cx={300} cy={585} size={22} weight={600} color={GREY}>CherenkovCone</CText>
    <CText cx={660} cy={620} size={22} weight={600} color={GREY}>EarthIcon</CText>
    <CText cx={920} cy={620} size={22} weight={600} color={GREY}>GalaxyIcon</CText>
    <CText cx={1130} cy={590} size={22} weight={600} color={GREY}>MedalIcon</CText>
    <CText cx={1120} cy={700} size={22} weight={600} color={GREY}>EnvelopeIcon</CText>
  </AbsoluteFill>
);
