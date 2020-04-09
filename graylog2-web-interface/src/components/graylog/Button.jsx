import React, { forwardRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Button as BootstrapButton } from 'react-bootstrap';
import styled from 'styled-components';

import { propTypes, defaultProps } from './props/button';

const StyledButton = styled(BootstrapButton)(({ theme }) => {
  return theme.components.buttonStyles;
});

const Button = forwardRef((props, ref) => {
  return <StyledButton {...props} ref={ref} />;
});

Button.propTypes = propTypes;
Button.defaultProps = defaultProps;

export default Button;
