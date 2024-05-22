import styled from "styled-components";

export const LeftButtonsContainer = styled.div`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 1000;
`;

export const RightButtonsContainer = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 1000;
`;

export const BottomButtonsContainer = styled.div`
  position: absolute;
  bottom: 0.5rem;
  width: 100%;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;
