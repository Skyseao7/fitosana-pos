// En: src/components/templates/HomeTemplate.jsx

import React, { useState } from 'react';
import styled from "styled-components";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DatePicker } from "antd"; // Importamos el DatePicker de Ant Design
import dayjs from "dayjs"; // Importamos dayjs para manejar las fechas
import { 
  useUsuariosStore, 
  MostrarTareas,
  InsertarTarea,
  CompletarTarea,
  MostrarRecordatorios,
  InsertarRecordatorio,
  CompletarRecordatorio 
} from '../../index'; // Tus funciones
// QUITAMOS LA IMPORTACIÓN DE DashboardHeader
import { Device } from "../../styles/breakpoints"; // Corregí la ruta de nuevo

// --- Componente Hilo: Input Tarea ---
// (Esta función no cambia)
function InputTarea({ id_empresa, id_usuario }) {
  const [descripcion, setDescripcion] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (p) => InsertarTarea(p),
    onSuccess: () => {
      queryClient.invalidateQueries(['tareas', id_empresa]);
      setDescripcion('');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (descripcion.trim() === '') return;
    mutation.mutate({
      id_empresa: id_empresa,
      id_usuario_creador: id_usuario,
      descripcion: descripcion,
    });
  };

  return (
    <InputForm onSubmit={handleSubmit}>
      <StyledInput
        type="text"
        placeholder="Nueva tarea..."
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        disabled={mutation.isPending}
      />
      <StyledButton type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? '...' : '+'}
      </StyledButton>
    </InputForm>
  );
}

// --- Componente Hilo: Input Recordatorio (CON ANT DESIGN!) ---
// (Esta función no cambia)
function InputRecordatorio({ id_empresa }) {
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(null); 
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (p) => InsertarRecordatorio(p),
    onSuccess: () => {
      queryClient.invalidateQueries(['recordatorios', id_empresa]);
      setDescripcion('');
      setFecha(null);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (descripcion.trim() === '' || !fecha) return;
    mutation.mutate({
      id_empresa: id_empresa,
      descripcion: descripcion,
      fecha_vencimiento: fecha.format('YYYY-MM-DD'), 
    });
  };

  return (
    <InputForm onSubmit={handleSubmit}>
      <StyledInput
        type="text"
        placeholder="Descripción del recordatorio..."
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        disabled={mutation.isPending}
      />
      <StyledDatePicker
        placeholder="Fecha de Vencimiento"
        value={fecha}
        onChange={(date) => setFecha(date)} 
        disabled={mutation.isPending}
        style={{ width: '100%' }}
      />
      <StyledButton type="submit" disabled={mutation.isPending} style={{ width: '100%' }}>
        {mutation.isPending ? 'Agregando...' : 'Agregar Recordatorio'}
      </StyledButton>
    </InputForm>
  );
}


// ---- El Template Principal ----
export function HomeTemplate() {
  const queryClient = useQueryClient();
  const { datausuarios } = useUsuariosStore(); 
  const id_empresa = datausuarios?.id_empresa;
  const id_usuario = datausuarios?.id;

  // ... (Todas tus useQuery y useMutation se quedan igual) ...
  // Query para TAREAS
  const { data: tareas, isLoading: isLoadingTareas } = useQuery({
    queryKey: ['tareas', id_empresa],
    queryFn: () => MostrarTareas({ id_empresa: id_empresa }),
    enabled: !!id_empresa, 
  });
  // Query para RECORDATORIOS
  const { data: recordatorios, isLoading: isLoadingRecordatorios } = useQuery({
    queryKey: ['recordatorios', id_empresa],
    queryFn: () => MostrarRecordatorios({ id_empresa: id_empresa }),
    enabled: !!id_empresa,
  });
  // Mutación para COMPLETAR TAREA
  const completarTareaMutation = useMutation({
    mutationFn: (p) => CompletarTarea(p),
    onSuccess: () => queryClient.invalidateQueries(['tareas', id_empresa]),
  });
  // Mutación para COMPLETAR RECORDATORIO
  const completarRecordatorioMutation = useMutation({
    mutationFn: (p) => CompletarRecordatorio(p),
    onSuccess: () => queryClient.invalidateQueries(['recordatorios', id_empresa]),
  });


  if (isLoadingTareas || isLoadingRecordatorios || !id_empresa) {
    return <Container><div>Cargando...</div></Container>;
  }

  return (
    <Container>
      {/* 1. Reemplazamos el DashboardHeader por un título simple */}
      <Title>Home</Title>
      
      {/* 2. El grid con tus widgets se queda igual */}
      <DashboardGrid>
        
        {/* Widget de Tareas */}
        <WidgetCard>
          <WidgetTitle>📝 To-Do List</WidgetTitle>
          <InputTarea id_empresa={id_empresa} id_usuario={id_usuario} />
          <List>
            {tareas?.map((tarea) => (
              <ListItem key={tarea.id}>
                <Checkbox
                  type="checkbox"
                  onChange={() => completarTareaMutation.mutate({ id: tarea.id })}
                  disabled={completarTareaMutation.isPending}
                />
                <span>{tarea.descripcion}</span>
              </ListItem>
            ))}
            {tareas?.length === 0 && <EmptyText>No hay tareas pendientes.</EmptyText>}
          </List>
        </WidgetCard>
        
        {/* Widget de Recordatorios */}
        <WidgetCard>
          <WidgetTitle>🗓️ Productos por Vencer (Próximos 30 días)</WidgetTitle>
          <InputRecordatorio id_empresa={id_empresa} />
          <List>
            {recordatorios?.map((item) => (
              <ListItem key={item.id}>
                <Checkbox
                  type="checkbox"
                  onChange={() => completarRecordatorioMutation.mutate({ id: item.id })}
                  disabled={completarRecordatorioMutation.isPending}
                />
                <ExpiryDate>
                  F.V: {new Date(item.fecha_vencimiento + 'T00:00:00').toLocaleDateString()}
                </ExpiryDate>
                <span style={{ marginLeft: '8px' }}>{item.descripcion}</span>
              </ListItem>
            ))}
            {recordatorios?.length === 0 && <EmptyText>No hay vencimientos cercanos.</EmptyText>}
          </List>
        </WidgetCard>

      </DashboardGrid>
    </Container>
  );
}

// --- ESTILOS (STYLED-COMPONENTS) ---

// Añadimos el estilo para el Título (copiado de tu DashboardHeader)
const Title = styled.h1`
  font-size: 40px;
  font-weight: bold;
  margin: 0;
`;

// El resto de estilos se quedan exactamente igual
const Container = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr; // Una columna por defecto para móviles
  gap: 20px;

  @media ${Device.desktop} {
    grid-template-columns: 1fr 1fr; // Dos columnas para desktop
  }
`;

const WidgetCard = styled.div`
  background-color: ${({ theme }) => theme.body};
  border: 1px solid ${({ theme }) => theme.bordercolorDash};
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const WidgetTitle = styled.h2`
  font-size: 22px;
  font-weight: bold;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px; // espacio para los iconos
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 16px 0 0 0;
  max-height: 300px;
  overflow-y: auto;
`;

const ListItem = styled.li`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 16px;
`;

const Checkbox = styled.input`
  margin-right: 12px;
  cursor: pointer;
  width: 18px;
  height: 18px;
`;

const ExpiryDate = styled.span`
  color: ${({ theme }) => theme.danger}; // Asumo que tienes un color de peligro/rojo
  font-weight: bold;
  white-space: nowrap;
`;

const EmptyText = styled.p`
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  opacity: 0.7;
  text-align: center;
  padding: 20px 0;
`;

const InputForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StyledInput = styled.input`
  width: 95%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.bordercolorDash};
  background-color: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.text};
  font-size: 16px;
  
  &::placeholder {
    color: ${({ theme }) => theme.text}80; // color de texto con opacidad
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary}; // Asumo un color primario
    box-shadow: 0 0 0 2px ${({ theme }) => theme.primary}30;
  }
`;

const StyledButton = styled.button`
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.primary}; // Asumo un color primario
  color: #fff; // Texto blanco para contraste
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ESTILO PARA EL CALENDARIO (Se queda igual, ¡esto es lo que querías!)
const StyledDatePicker = styled(DatePicker)`
  background-color: ${({ theme }) => theme.bg};
  border: 1px solid ${({ theme }) => theme.bordercolorDash};
  border-radius: 8px;
  padding: 10px 12px;

  .ant-picker-input > input {
    color: ${({ theme }) => theme.text};
    font-weight: bold;
  }
  .ant-picker-input input::placeholder {
    color: ${({ theme }) => theme.text}80;
  }
  .ant-picker-suffix {
    color: ${({ theme }) => theme.text};
  }
  &:hover {
    border-color: ${({ theme }) => theme.primary};
  }
  &:focus,
  &.ant-picker-focused {
    border-color: ${({ theme }) => theme.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.primary}30;
  }
`;