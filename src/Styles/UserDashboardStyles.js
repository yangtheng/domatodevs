import { coreColors, coreFonts } from './cores.js'
// NEEDS RADIUM? YES
/* ----------------------------- */
const dashboardPageContainer = {
  margin: '52px auto 0 auto',
  width: '1265px',
  minHeight: 'calc(100vh + 177px - 56px)'
  // min height is full height + profile section, minus duplicated height of sticky tabs bar.
}

const profileSectionContainer = {
  width: '1265px',
  height: '177px',
  padding: '48px 0 32px 0',
  display: 'flex'
}

const profilePicContainer = {
  position: 'relative',
  width: '97px',
  height: '97px'
}
const profilePicTint = {
  background: coreColors.white03,
  width: '97px',
  height: '97px',
  borderRadius: '50%',
  position: 'absolute',
  top: '0',
  left: '0',
  textAlign: 'center',
  padding: '30px 0 30px 0',
  cursor: 'pointer',
  opacity: 0,
  ':hover': {opacity: '1'}
}
const profilePicTintText = {
  fontSize: '16px',
  textShadow: `2px 2px 0 ${coreColors.whiteSolid}`
}
const profilePic = {
  borderRadius: '50%',
  display: 'inline-block'
}
/* ----------------------------- */
const bioSectionContainer = {
  width: 'calc(100% - 97px)',
  height: '97px',
  padding: '0 20px 0 20px'
}
const username = {
  ...coreFonts.robotoThin,
  color: coreColors.black07,
  fontSize: '55px',
  lineHeight: '66px',
  margin: 0
}

const bioTextContainer = {display: 'inline-flex', justifyContent: 'flex-start', alignItems: 'center', width: 'auto'}

const bioText = {
  ...coreFonts.garamondRegular,
  color: coreColors.blackSolid,
  fontSize: '24px',
  lineHeight: '31px',
  margin: '0'
}

const bioTextAreaContainer = {display: 'inline-flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}

const bioTextArea = {
  ...coreFonts.garamondRegular,
  color: coreColors.blackSolid,
  fontSize: '24px',
  lineHeight: '31px',
  height: '31px',
  margin: '0',
  padding: '0',
  width: '100%',
  resize: 'none'
}
/* ----------------------------- */
const unclickedTab = {
  ...coreFonts.robotoLight,
  color: coreColors.black03,
  cursor: 'pointer',
  height: '100%',
  fontSize: '24px',
  marginTop: '1px',
  marginRight: '40px',
  paddingTop: '16px',
  paddingBottom: '16px'
}
const clickedTab = {
  ...unclickedTab,
  color: coreColors.pinkSolid,
  borderBottom: `3px solid ${coreColors.pinkSolid}`
}
const tabsBarNonSticky = {
  boxSizing: 'border-box',
  borderBottom: `1px solid ${coreColors.black03}`,
  display: 'flex',
  justifyContent: 'flex-start',
  height: '56px',
  background: coreColors.whiteSolid,
  position: 'relative',
  top: '0',
  width: '100%'
}
const tabsBarSticky = {
  ...tabsBarNonSticky,
  position: 'fixed',
  top: '52px',
  width: '1265px'
}
/* ----------------------------- */
// EXPORT OBJ TO REDUCE NUMBER OF NAMED IMPORTS {FOO, BAR, ETC}
export const userDashboardStyles = {
  dashboardPageContainer,
  profileSectionContainer,
  // PROFILE PIC CONTAINER, IMG, TINT
  profilePicContainer,
  profilePicTint,
  profilePicTintText,
  profilePic,
  // BIO SECTION
  bioSectionContainer, // container for username + bio
  username,
  bioTextContainer, // display version container
  bioText,
  bioTextAreaContainer, // editable textarea container
  bioTextArea,
  // HORIZONTAL MENU TABS
  tabsBarNonSticky,
  tabsBarSticky,
  unclickedTab,
  clickedTab
}
/* ----------------------------- */
