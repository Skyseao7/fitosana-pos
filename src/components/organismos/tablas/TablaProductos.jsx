import styled from "styled-components";
import {
  // Checkbox1 ya no se usa aquí
  ContentAccionesTabla,
  Paginacion,
  useProductosStore,
} from "../../../index";
import Swal from "sweetalert2";
import { v } from "../../../styles/variables";
// 👇 ASEGÚRATE DE IMPORTAR ESTOS 👇
import { useState, useMemo, useCallback, useEffect } from "react"; 
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { FaArrowsAltV } from "react-icons/fa";

export function TablaProductos({
  data,
  SetopenRegistro,
  setdataSelect,
  setAccion,
}) {
  console.log("Datos recibidos por la tabla:", data); // Verificación

  // FIX: Maneja el caso inicial donde 'data' puede ser null o undefined
  const defaultData = useMemo(() => [], []); 
  const tableData = data ?? defaultData; 
  const [isReady, setIsReady] = useState(false);
  const [columnFilters, setColumnFilters] = useState([]);
  const { eliminarProductos } = useProductosStore();

  // FIX: Funciones envueltas en useCallback para optimizar
  const eliminar = useCallback((p) => {
    if (p.nombre === "General") {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Este registro no se permite modificar ya que es valor por defecto.",
      });
      return;
    }
    Swal.fire({
      title: "¿Estás seguro/a?",
      text: "Una vez eliminado, ¡no podrá recuperar este registro!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, eliminar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await eliminarProductos({ id: p.id });
      }
    });
  }, [eliminarProductos]);

  const editar = useCallback((data) => {
    SetopenRegistro(true);
    setdataSelect(data);
    setAccion("Editar");
  }, [SetopenRegistro, setdataSelect, setAccion]);

  // FIX: Columnas corregidas y envueltas en useMemo
  const columns = useMemo(
    () => [
      {
        accessorKey: "nombre",
        header: "Nombre",
        cell: (info) => <span>{info.getValue()}</span>,
        enableColumnFilter: true,
      },
       { // Columna Marca (antes categoría)
        accessorKey: "marca", 
        header: "Marca",
        cell: (info) => <span>{info.getValue()}</span>,
        enableColumnFilter: true,
      },
      {
        accessorKey: "p_venta",
        header: "Precio",
        cell: (info) => <span>{info.getValue()}</span>,
        enableColumnFilter: true,
      },
      {
        accessorKey: "p_compra",
        header: "C/U",
        cell: (info) => <span>{info.getValue()}</span>,
        enableColumnFilter: true,
      },
      {
        accessorKey: "sevende_por",
        header: "Tipo",
        cell: (info) => <span>{info.getValue()}</span>,
        enableColumnFilter: true,
      },
      { // Columna Stock
        accessorKey: "total_stock", 
        header: "Stk", 
        cell: (info) => <span>{info.getValue()}</span>, 
        enableColumnFilter: true, 
      },
       { // Columna Ubicación
        accessorKey: "ubicaciones", 
        header: "Detalles", 
        cell: (info) => {
          const ubicacionValue = info.getValue(); 
          return <span>{ubicacionValue ? ubicacionValue : '-'}</span>; 
        },
        enableColumnFilter: true, 
      },
      { // Columna Acciones
        accessorKey: "acciones",
        header: "", // Sin título 
        enableSorting: false,
        cell: (info) => ( 
          <ContentAccionesTabla
            funcionEditar={() => editar(info.row.original)}
            funcionEliminar={() => eliminar(info.row.original)}
          />
        ),
        enableColumnFilter: false, 
      },
    ],
    [editar, eliminar] // Dependencias correctas
  );

  // FIX: Estado de paginación controlado por react-table
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10, // Puedes ajustar esto
  });

  const table = useReactTable({
    data: tableData, // FIX: Usa tableData (maneja null)
    columns,
    state: {
      columnFilters,
      pagination, // Añade el estado de paginación
    },
    onPaginationChange: setPagination, // Permite que la tabla controle la paginación
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), 
    getPaginationRowModel: getPaginationRowModel(), 
    getSortedRowModel: getSortedRowModel(), 
    columnResizeMode: "onChange", 
    // FIX: 'meta' eliminado si no se usa
  });
  
  // 👇 FIX: useEffect AÑADIDO para el bug de layout 👇
  useEffect(() => {
    // Cuando el componente monta o los datos cambian,
    // espera un poco antes de marcar como listo para renderizar la tabla.
    setIsReady(false); // Reinicia si los datos cambian
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 150); // Delay de 150ms (puedes ajustar si es necesario)

    return () => clearTimeout(timer); // Limpia el timer
  }, [tableData]); // Depende de los datos de la tabla

  if (!isReady || !tableData) {
      return <div>Cargando tabla...</div>; // O un spinner
  }


  return (
    <>
      <Container>
        {/* Solo renderiza la tabla si isReady es true */}
        {isReady && ( 
          <table className="responsive-table">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} style={{ width: header.getSize() }}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <span
                        style={{ cursor: "pointer", marginLeft: '5px', verticalAlign: 'middle' }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                         <FaArrowsAltV size="0.8em"/>
                      </span>
                    )}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted()] ?? null}
                     {/* Resizer */}
                    <div
                        {...{
                          onMouseDown: header.getResizeHandler(),
                          onTouchStart: header.getResizeHandler(),
                          className: `resizer ${
                            header.column.getIsResizing() ? "isResizing" : ""
                          }`,
                          style: {
                            transform: header.column.getIsResizing()
                              ? `translateX(${
                                  table.getState().columnSizingInfo.deltaOffset ?? 0
                                }px)`
                              : '',
                        },
                      }}
                    />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          {/* FIX: TBODY CORREGIDO */}
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} data-title={cell.column.columnDef.header} style={{ width: cell.column.getSize() }}>
                    <div className={cell.column.id === "acciones" ? "" : "ContentCell"}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        )} 
        {/* La paginación puede estar fuera del condicional si quieres verla siempre */}
        <Paginacion table={table} />
      </Container>
    </>
  );
}

// 👇 TU COMPONENTE STYLED 'Container' (USA LA ÚLTIMA VERSIÓN QUE TE DI) 👇
const Container = styled.div`
  position: relative;
  margin: 5% 3%;
  @media (min-width: ${v.bpbart}) {
    margin: 2%;
  }
  @media (min-width: ${v.bphomer}) {
    margin: 2em auto;
  }
  .responsive-table {
    width: 100%;
    margin-bottom: 1.5em;
    border-spacing: 0;
    border-collapse: collapse; 

    @media (min-width: ${v.bpbart}) {
      font-size: 0.9em;
    }
    @media (min-width: ${v.bpmarge}) {
      font-size: 1em;
    }

    thead {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;

      @media (min-width: ${v.bpbart}) { 
        position: relative; 
        width: auto;
        height: auto;
        margin: 0;
        overflow: visible;
        clip: auto;
        white-space: normal;
      }

      th {
        border-bottom: 2px solid ${({ theme }) => theme.color2};
        font-weight: 700;
        text-align: center;
        color: ${({ theme }) => theme.text};
        position: relative; 
        padding: 0.75em 0.5em; 
        vertical-align: middle; 

         &:first-of-type {
           text-align: left; 
           padding-left: 0.75em; 
         }
         &:last-of-type {
            padding-right: 0.75em; 
         }
         span{ 
           font-size:0.8em;
           margin-left: 4px;
           vertical-align: middle; 
         }
      }
    }

    tbody,
    tr,
    td { // Solo td debería ser block en móvil
      display: block; 
      padding: 0;
      text-align: left;
      white-space: normal;
       @media (min-width: ${v.bpbart}) { // Comportamiento escritorio
         display: table-cell; 
         padding: 0.75em 0.5em; // Padding escritorio
         vertical-align: middle;
         text-align: center; // Centrado por defecto en escritorio
         border-bottom: none; // Borde va en la fila (tr)
          &:first-child{
           text-align: left; // Primera columna a la izquierda
           padding-left: 0.75em; // Padding izq
         }
          &:last-child{
            padding-right: 0.75em; // Padding der
          }
       }
    }

    tr {
       display: block; 
       margin-bottom: 1em; 
       border: 1px solid ${({ theme }) => theme.color2}; 
       border-radius: ${v.borderRadius}; 
       overflow: hidden; 
       background-color: ${({ theme }) => theme.bgcards}; 

      @media (min-width: ${v.bpbart}) { 
        display: table-row; 
        margin-bottom: 0; 
        border: none; 
        border-radius: 0; 
        background-color: transparent; 
        border-bottom: 1px solid ${({ theme }) => theme.color2}; 

          &:nth-of-type(even) { 
            background-color: ${({ theme }) => theme.bgAlpha}; 
          }
          &:last-of-type {
            border-bottom: none; 
          }
      }
    }

    td { 
       padding: 0.75em; 
       vertical-align: middle;
       text-align: right; 
       border-bottom: 1px solid ${({ theme }) => theme.color2}; 

       &:last-child{
         border-bottom: none; 
       }
       // Estilos escritorio ya están arriba en la regla general td
    }

    tbody {
      @media (min-width: ${v.bpbart}) {
        display: table-row-group; 
      }

      .ContentCell { 
        display: flex;
        justify-content: space-between; 
        align-items: center;
        height: auto; 
        padding: 0; 
        border-bottom: none; 

        @media (min-width: ${v.bpbart}) { 
          display: block; 
          justify-content: center; 
        }
      }
      
      td[data-title]:before { 
        content: attr(data-title);
        display: inline-block; 
        font-size: 0.85em; 
        font-weight: 600; 
        color: ${({ theme }) => theme.text}; 
        opacity: 0.7; 
        margin-right: 0.5em; 

        @media (min-width: ${v.bpbart}) {
          content: none; 
          display: none;
          margin-right: 0;
        }
      }
    }
     .resizer {
       position: absolute;
       right: 0;
       top: 0;
       height: 100%;
       width: 5px;
       background: rgba(0, 0, 0, 0.5);
       cursor: col-resize;
       user-select: none;
       touch-action: none;
       opacity: 0; 
       z-index: 1; 
       &:hover, &.isResizing{
         opacity: 1; 
         background: ${({ theme }) => v.colorPrincipal}; // Usa tu color principal
       }
     }
  }
`;