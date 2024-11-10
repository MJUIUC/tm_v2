import { Router } from 'express';

export default abstract class HttpApiController {
    public abstract path: string;
    public router: Router = Router();

    constructor() {
        this.initRoutes();
    }

    public abstract initRoutes(): void;
}