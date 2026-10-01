import { http } from '@/plugins/axios'

export interface Info {
  name: string
  version: string
}

export async function getInfo(): Promise<Info> {
  return (await http.get<Info>('/')).data
}
