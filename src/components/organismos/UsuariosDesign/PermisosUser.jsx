import styled from "styled-components";
import { SelectList } from "../../ui/lists/SelectList";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useModulosStore } from "../../../store/ModulosStore";
import { Check } from "../../ui/toggles/Check";
import { useRolesStore } from "../../../store/RolesStore";
import { usePermisosStore } from "../../../store/PermisosStore";
import { useEffect } from "react";
import { useAsignacionCajaSucursalStore } from "../../../store/AsignacionCajaSucursalStore";
import { BarLoader } from "react-spinners";
import { useUsuariosStore } from "../../../store/UsuariosStore";
export const PermisosUser = () => {
  const {
    mostrarPermisos,
    toggleModule,
    selectedModules,
    setSelectedModules,
    mostrarPermisosDefault,
    actualizarPermisos,
    datapermisos,
  } = usePermisosStore();
  const { accion, selectItem: selectItemAsignaciones } =
    useAsignacionCajaSucursalStore();
  const { mostrarModulos } = useModulosStore();
  const { mostrarRoles, rolesItemSelect, setRolesItemSelect,dataroles } = useRolesStore();
  const { itemSelect } = useUsuariosStore();

  const { data: datamodulos, isLoading: isLoadingModulos } = useQuery({
    queryKey: ["mostrar modulos"],
    queryFn: mostrarModulos,
  });

  const { data: dataPermisosDefault, isLoading: isLoadingPermisosDefault } =
    useQuery({
      queryKey: ["mostrar permisos default"],
      queryFn: mostrarPermisosDefault,
    });
  const { isLoading: isLoadingPermisosUser } = useQuery({
    queryKey: [
      "mostrar permisos por usuario",
      { id_usuario: itemSelect?.id_usuario },
    ],
    queryFn: () => mostrarPermisos({ id_usuario: itemSelect?.id_usuario }),
    enabled: !!itemSelect,
  });
  const mutation = useMutation({
    mutationKey: ["actualizar permisos"],
    mutationFn: () => actualizarPermisos(),
  });
  useEffect(() => {
    if (accion === "Nuevo") {
      const permisosPorRol =
        dataPermisosDefault
          ?.filter((permiso) => permiso.id_rol === rolesItemSelect?.id)
          .map((permiso) => permiso.id_modulo) || [];
      setSelectedModules(permisosPorRol);
    }else{
       setRolesItemSelect({
          id: itemSelect.id_rol,
          nombre: itemSelect.rol,
       });
    }
  }, []);
  useEffect(() => {
    if (accion !== "Nuevo" && datapermisos) {
      const permisosUsuario = datapermisos.map((p) => p.idmodulo);
      setSelectedModules(permisosUsuario);
    }
  }, [accion, datapermisos]);
  const isLoading =
    isLoadingModulos ||
   
    isLoadingPermisosDefault ||
    isLoadingPermisosUser;
  if (isLoading) return <BarLoader />;
  
  return (
    <Container>
      <label>Tipo: </label>
      <SelectList
        data={dataroles}
        displayField="nombre"
        onSelect={setRolesItemSelect}
        itemSelect={rolesItemSelect}
      />
      <List>
        {datamodulos?.map((module, index) => {
          const isChecked = itemSelect
            ? datapermisos?.some(
                (p) => String(p.idmodulo) === String(module.id)
              )
            : selectedModules.includes(module.id);
          return (
            <ListItem key={module.id}>
              <Check
                checked={isChecked}
                onChange={() => toggleModule(module.id)}
              />
              <Label>{module.nombre} </Label>
            </ListItem>
          );
        })}
      </List>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 80%;
  padding: 1.5rem;
`;
const Title = styled.span`
  font-size: 1.5rem;
  text-align: center;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 1.5rem; /* Añadido para separar del dropdown */

  display: grid; /* 1. Activa CSS Grid */
  gap: 10px; /* 2. Define el espacio entre los items */

  /* 3. Define las columnas */
  /* Por defecto, 1 columna en móviles */
  grid-template-columns: 1fr;

  /* A partir de 768px (tablets), usa 3 columnas */
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }

  /* Opcional: si quieres 3 columnas siempre, 
     borra el @media y deja solo:
     grid-template-columns: repeat(3, 1fr);
  */
`;

const ListItem = styled.li`
  display: flex;
  align-items: center;
  /* El padding se maneja mejor con el 'gap' de la grilla */
  /* padding: 0.5rem 0; */
`;
const Label = styled.span`
  font-size: 1rem;
  color: #555;
  margin-left: 15px; /* Reducido un poco para mejor ajuste */
`;