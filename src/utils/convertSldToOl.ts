
import OpenLayersParser from "geostyler-openlayers-parser";
import SldStyleParser from 'geostyler-sld-parser';
import { Style } from 'ol/style';

export async function convertSldToOl(sld: string): Promise<Style | Style[]> {


    const sldParser = new SldStyleParser();
    const olParser = new OpenLayersParser()

    const style = await sldParser.readStyle(sld);

    if (!style) {
        throw new Error('Invalid SLD style');
    }

    return (await olParser.writeStyle(style.output!)).output as Style | Style[];
}   