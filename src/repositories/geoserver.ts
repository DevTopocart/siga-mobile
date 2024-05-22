import { CapacitorHttp } from "@capacitor/core";

// export const geoserver = axios.create({
//   baseURL: 'http://siga.angra.rj.gov.br/geoserver',
//   headers: {
//     'Authorization': `Basic YWRtaW46SzhfUFFhPUQ=`
//   }
// })

export async function geoserver(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  params: any = {},
  body?: any,
) {
  const url = new URL(endpoint, "http://siga.angra.rj.gov.br");

  console.info('Fetching URL on Geoserver:', url.toString())

  Object.keys(params).forEach((key) =>
    url.searchParams.append(key, params[key]),
  );

  const options = {
    url: url.toString(),
    method: method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic YWRtaW46SzhfUFFhPUQ=`,
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    const response = await CapacitorHttp.request(options);
    return response;
  } catch (error) {
    throw error;
  }
}
