let dropdownRenderToken = 0;
let isPickingSuggestion = false;

export const nextDropdownRenderToken = () => {
  dropdownRenderToken += 1;
  return dropdownRenderToken;
};

export const isActiveDropdownRenderToken = (token: number) => {
  return token === dropdownRenderToken;
};

export const startPickingSuggestion = () => {
  if (isPickingSuggestion) return false;
  isPickingSuggestion = true;
  return true;
};

export const finishPickingSuggestion = () => {
  window.setTimeout(() => {
    isPickingSuggestion = false;
  }, 0);
};

export const stopEvent = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();

  if ("stopImmediatePropagation" in event) {
    event.stopImmediatePropagation();
  }
};
