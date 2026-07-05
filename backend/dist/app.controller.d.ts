import { AppService } from './app.service';
export declare class CreateTestDto {
    message: string;
    status?: string;
    payload?: Record<string, any>;
    ipAddress?: string;
}
export declare class BulkCreateTestDto {
    messages: string[];
}
export declare class UpdateStatusDto {
    status: string;
}
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getTests(): Promise<any[]>;
    createTest(body: CreateTestDto): Promise<any>;
    createBulk(body: BulkCreateTestDto): Promise<any[]>;
    updateStatus(id: number, body: UpdateStatusDto): Promise<any>;
}
