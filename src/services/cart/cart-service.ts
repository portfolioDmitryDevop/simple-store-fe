import { ProductBatch } from "../../models/product";
import LocalStorageProvider from "./local-storage-provider";

export default class ShoppingCartService extends LocalStorageProvider<ProductBatch> {
    constructor(storageName: string) {
        super(storageName);
    }

    getItemsCount(): number {
        let res = 0;
        const batches = this.getAll();
        for (let batch of batches) {
            res += batch.count;
        }
        return res;
    }
}