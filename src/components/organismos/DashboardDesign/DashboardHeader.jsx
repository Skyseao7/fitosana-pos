import styled from "styled-components";
import { Device } from "../../../styles/breakpoints";
import { DateRangeFilter } from "./DateRangeFilter";

export const DashboardHeader = ({ title = "Dashboard" }) => {
  return (
    <Container>
      <TextContainer>
        <Title>{title}</Title>
      </TextContainer>
      <ActionsContainer>
        <DateRangeFilter />
      </ActionsContainer>
    </Container>
  );
};
const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  @media ${Device.desktop} {
    flex-direction: row;
  }
`;
const TextContainer = styled.div``;
const Title = styled.h1`
font-size: 40px;
font-weight: bold;
margin: 0;
`;
const ActionsContainer = styled.div`
  border: 2px solid ${({ theme }) => theme.bordercolorDash};
  border-radius: 10px;
  background-color: ${({ theme }) => theme.body};
`;
