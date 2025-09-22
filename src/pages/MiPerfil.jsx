import React from "react";
import styled from "styled-components";
import { InputText2 } from "../components/organismos/formularios/InputText2";
import { Btn1 } from "../components/moleculas/Btn1";
import { useForm } from "react-hook-form";

import { slideBackground } from "../styles/keyframes";

import { Toaster } from "sonner";
import { useUsuariosStore } from "../store/UsuariosStore";
import { useEditarPerfilMutation } from "../tanstack/UsuariosStack";
export const MiPerfil = () => {
  const { datausuarios } = useUsuariosStore();
  return (
    <Container>
      <Title>Mi Perfil</Title>
      <Avatar>
        <ContentRol>
          <span>{datausuarios?.roles?.nombre} </span>
        </ContentRol>
        <span className="nombre">{datausuarios?.nombres}</span>
      </Avatar>
      <Label>Nombres</Label>
      <InputText2>
        <span className="form__field" style={{background:'#f3f3f3',padding:'10px 16px',borderRadius:'8px',width:'100%',display:'block',color:'#222',fontWeight:'500'}}>{datausuarios?.nombres}</span>
      </InputText2>
      <Label>Numero Identidad</Label>
      <InputText2>
        <span className="form__field" style={{background:'#f3f3f3',padding:'10px 16px',borderRadius:'8px',width:'100%',display:'block',color:'#222',fontWeight:'500'}}>{datausuarios?.nro_doc}</span>
      </InputText2>
      <Label>Celular</Label>
      <InputText2>
        <span className="form__field" style={{background:'#f3f3f3',padding:'10px 16px',borderRadius:'8px',width:'100%',display:'block',color:'#222',fontWeight:'500'}}>{datausuarios?.telefono}</span>
      </InputText2>
      <Label>Email</Label>
      <InputText2>
        <span className="form__field" style={{background:'#f3f3f3',padding:'10px 16px',borderRadius:'8px',width:'100%',display:'block',color:'#222',fontWeight:'500'}}>{datausuarios?.correo}</span>
      </InputText2>
    </Container>
  );
};
const ContentRol = styled.div`
  background-color: #391ebb;
  border: 2px solid #fff;
  border-radius: 8px;
  position: absolute;
  top: -10px;
  right: 10px;
  padding: 5px 8px;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
`;
const Container = styled.div`
  padding: 20px;
  border-radius: 10px;
  max-width: 400px;
  margin: 0 auto;
  position: relative;
  p {
    color: #f75510;
    font-weight: 700;
  }
  .advertencia {
    background-color: rgba(237, 95, 6, 0.2);
    border-radius: 10px;
    padding: 10px;
    margin-top: 10px;
    margin: auto;
    height: 70px;
    display: flex;
    color: #f75510;
    width: 100%;
    align-items: center;
    .icono {
      font-size: 100px;
    }
  }
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
`;

const Avatar = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
  width: 100%;
  border-radius: 10px;
  padding: 10px;
  .nombre {
    font-weight: 700;

    text-align: center;
    align-self: center;

    font-size: 25px;
    overflow: hidden; /* Para asegurarse de que el contenido adicional esté oculto */
    white-space: normal; /* Permite el salto de línea */
    word-wrap: break-word; /* Rompe las palabras largas y las envuelve a la siguiente línea */
    color: #fff !important;
  }
  background-color: #391ebb;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 120 120'%3E%3Cpolygon fill='%23000' fill-opacity='0.19' points='120 0 120 60 90 30 60 0 0 0 0 0 60 60 0 120 60 120 90 90 120 60 120 0'/%3E%3C/svg%3E");

  background-size: 60px 60px;
  animation: ${slideBackground} 10s linear infinite;
  img {
    object-fit: cover;
  }
  input {
    display: none;
  }
`;

const Label = styled.label`
  display: block;
  margin: 10px 0 5px;
`;
