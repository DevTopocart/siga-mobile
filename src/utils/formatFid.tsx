import { isNumber } from "lodash";

/**
 * Formata um valor FID para uso em consultas SQL, envolvendo-o em aspas simples se for um número.
 *
 * @param fid - O valor FID a ser formatado.
 * @returns Uma string formatada que pode ser usada em consultas SQL.
 */
export default function formatFid(fid: string) {
    if (isNumber(+fid)) {
      return `'${fid}'`;
    } else {
      return fid;
    }
  }
  