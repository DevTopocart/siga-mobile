import styled from "styled-components";

export const Slider = styled.div<{ currentSlide: number }>`
  display: flex;
  flex: 1;
  overflow-x: scroll;
  margin-left: ${({ currentSlide }) => `calc(-100vw * ${currentSlide})`};
  transition: margin-left 0.3s ease-in-out;
`;

export const Card = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 100vw;
  height: 100vh;
`;

export const styles = {
  height: "100%",
  justifyContent: "center",
  alignItens: "center",
  margin: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "36px",
};
