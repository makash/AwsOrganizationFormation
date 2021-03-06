import { Command } from 'commander';
import { ConsoleUtil } from '../util/console-util';
import { BaseCliCommand, ICommandArgs } from './base-command';
import { TaskRunner } from '~org-binder/org-task-runner';
import { TemplateRoot } from '~parser/parser';
import { PersistedState } from '~state/persisted-state';
import { IBuildTask } from '~org-binder/org-tasks-provider';


const commandName = 'update <templateFile>';
const commandDescription = 'update organization resources';

export class UpdateOrganizationCommand extends BaseCliCommand<IUpdateOrganizationCommandArgs> {

    public static async Perform(command: IUpdateOrganizationCommandArgs): Promise<void> {
        const x = new UpdateOrganizationCommand();
        await x.performCommand(command);
    }

    constructor(command?: Command) {
        super(command, commandName, commandDescription, 'templateFile');
    }

    public addOptions(command: Command): void {
        super.addOptions(command);
    }

    public async performCommand(command: IUpdateOrganizationCommandArgs): Promise<void> {
        const template = TemplateRoot.create(command.templateFile);
        const state = await this.getState(command);
        const templateHash = template.hash;

        const lastHash = state.getTemplateHash();
        if (lastHash === templateHash) {
            ConsoleUtil.LogInfo('organization up to date, no work to be done.');
            return;
        }

        const binder = await this.getOrganizationBinder(template, state);
        const tasks = binder.enumBuildTasks();
        await UpdateOrganizationCommand.ExecuteTasks(tasks, state, templateHash, template);
    }

    public static async ExecuteTasks(tasks: IBuildTask[], state: PersistedState, templateHash: string, template: TemplateRoot): Promise<void> {
        try {
            if (tasks.length === 0) {
                ConsoleUtil.LogInfo('organization up to date, no work to be done.');
            }
            else {
                await TaskRunner.RunTasks(tasks);
                ConsoleUtil.LogInfo('done');
            }
            state.putTemplateHash(templateHash);
            state.setPreviousTemplate(template.source);
        }
        finally {
            await state.save();
        }
    }
}

export interface IUpdateOrganizationCommandArgs extends ICommandArgs {
    templateFile: string;
}
