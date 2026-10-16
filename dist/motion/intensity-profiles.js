//#region src/motion/intensity-profiles.ts
const motionIntensities = [
	"none",
	"functional",
	"expressive",
	"showcase"
];
/**
* The four resolved profiles. Values are deliberately monotonic so a caller
* can reason "more intensity = more of everything" without reading each field.
*/
const intensityProfiles = {
	none: {
		pointer: false,
		ambient: false,
		stagger: 0,
		travel: 0,
		glow: 0,
		depth: 0
	},
	functional: {
		pointer: false,
		ambient: false,
		stagger: .03,
		travel: .5,
		glow: .5,
		depth: .35
	},
	expressive: {
		pointer: true,
		ambient: true,
		stagger: .045,
		travel: 1,
		glow: 1,
		depth: 1
	},
	showcase: {
		pointer: true,
		ambient: true,
		stagger: .06,
		travel: 1.35,
		glow: 1.4,
		depth: 1.5
	}
};
//#endregion
export { intensityProfiles, motionIntensities };

//# sourceMappingURL=intensity-profiles.js.map